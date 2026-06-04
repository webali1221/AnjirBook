'use client';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './BookPurchaseModal.module.css';

// Haversine formula to calculate distance in km between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.max(1, Math.round(d)); // Minimum 1 km
};

// Format Nominatim address object into a clean, concise Uzbek address
const formatAddress = (addressObj) => {
  if (!addressObj) return '';
  const parts = [];
  
  const road = addressObj.road || addressObj.suburb || addressObj.neighbourhood;
  const houseNumber = addressObj.house_number;
  const suburb = addressObj.suburb || addressObj.district;
  const city = addressObj.city || addressObj.town || addressObj.village || 'Toshkent';

  if (road) {
    if (houseNumber) {
      parts.push(`${road}, ${houseNumber}-uy`);
    } else {
      parts.push(road);
    }
  }
  
  if (suburb) {
    const subStr = suburb.toLowerCase().includes('tuman') ? suburb : `${suburb} tumani`;
    parts.push(subStr);
  }
  
  if (city && city !== suburb && !city.toLowerCase().includes('toshkent')) {
    parts.push(city);
  } else if (!suburb && city) {
    parts.push(city);
  }
  
  return parts.length > 0 ? parts.join(', ') : '';
};

export default function BookPurchaseModal({ book, onClose, onSuccess }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  
  const [step, setStep] = useState('details'); // 'details', 'method', 'pay', 'processing', 'success'
  const [distance, setDistance] = useState(0); // auto-calculated based on address
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  // Leaflet references
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletInstance, setLeafletInstance] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const isMapSelected = useRef(false);
  const mapDistance = useRef(0);

  // Card form states (for simulated payment)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const title = lang === 'ru' && book.titleRu ? book.titleRu : book.title;
  
  // Calculate price with premium discount if active
  const basePrice = user?.isPremium ? Math.round(book.price * 0.8) : book.price;
  const deliveryFee = distance * 5000; // 5000 UZS per km
  const totalAmount = basePrice + deliveryFee;

  // Load Leaflet stylesheet and script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (window.L) {
      setMapLoaded(true);
      setLeafletInstance(window.L);
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        setMapLoaded(true);
        setLeafletInstance(window.L);
      };
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapLoaded || !leafletInstance || step !== 'details') return;

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('delivery-map');
      if (!mapContainer) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Office coords (Tashkent center - Amir Temur Square)
      const officeCoords = [41.311086, 69.279737];
      const initialCoords = officeCoords;

      const map = leafletInstance.map('delivery-map').setView(initialCoords, 13);
      mapRef.current = map;

      leafletInstance.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Custom markers to look premium and avoid bundle assets error
      const officeMarkerIcon = leafletInstance.divIcon({
        className: styles.officeMarker,
        html: `<div class="${styles.officePin}">🏢</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const userMarkerIcon = leafletInstance.divIcon({
        className: styles.customMarker,
        html: `<div class="${styles.markerPin}">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      // Add central office marker
      leafletInstance.marker(officeCoords, { icon: officeMarkerIcon })
        .addTo(map)
        .bindPopup("<b>Anjir Book</b><br/>Bosh Ofis / Omborxona")
        .openPopup();

      // Add user delivery marker
      const marker = leafletInstance.marker(initialCoords, {
        icon: userMarkerIcon,
        draggable: true
      }).addTo(map);
      markerRef.current = marker;

      // Invalidate size to prevent grey tiles
      map.invalidateSize();
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      // Handler for map clicks & marker moves
      const updateLocation = async (lat, lng) => {
        marker.setLatLng([lat, lng]);
        
        const dist = calculateDistance(officeCoords[0], officeCoords[1], lat, lng);
        isMapSelected.current = true;
        mapDistance.current = dist;
        setDistance(dist);

        setAddressLoading(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz,ru,en`);
          const data = await res.json();
          if (data) {
            const formatted = formatAddress(data.address);
            if (formatted) {
              setAddress(formatted);
            } else if (data.display_name) {
              setAddress(data.display_name);
            } else {
              setAddress(`Toshkent, Koordinatalar: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            }
          }
        } catch (err) {
          console.error(err);
          setAddress(`Toshkent, Koordinatalar: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setAddressLoading(false);
        }
      };

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        updateLocation(position.lat, position.lng);
      });

      map.on('click', (e) => {
        updateLocation(e.latlng.lat, e.latlng.lng);
      });

    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapLoaded, leafletInstance, step]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Sizning brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const officeCoords = [41.311086, 69.279737];

        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 15);

          const dist = calculateDistance(officeCoords[0], officeCoords[1], lat, lng);
          isMapSelected.current = true;
          mapDistance.current = dist;
          setDistance(dist);

          setAddressLoading(true);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz,ru,en`);
            const data = await res.json();
            if (data) {
              const formatted = formatAddress(data.address);
              if (formatted) {
                setAddress(formatted);
              } else if (data.display_name) {
                setAddress(data.display_name);
              } else {
                setAddress(`Toshkent, Koordinatalar: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
              }
            }
          } catch (err) {
            console.error(err);
            setAddress(`Toshkent, Koordinatalar: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          } finally {
            setAddressLoading(false);
          }
        }
      },
      (error) => {
        console.error(error);
        alert("Joylashuvingizni aniqlash imkoni bo'lmadi. Iltimos, xaritada o'zingiz belgilang.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    return parts.length > 0 ? parts.join(' ') : v;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handleAddressChange = (value) => {
    setAddress(value);
    const addr = value.toLowerCase().trim();
    if (!addr) {
      isMapSelected.current = false;
      mapDistance.current = 0;
      setDistance(0);
      return;
    }

    // If the address was set by the map/GPS, preserve that precise distance even if the user slightly modifies the text
    if (isMapSelected.current) {
      setDistance(mapDistance.current);
      return;
    }

    const districts = {
      'chilonzor': 5,
      'chilan': 5,
      'yunusobod': 12,
      'yunus': 12,
      'mirzo ulug': 8,
      'ulugbek': 8,
      'sergeli': 15,
      'sirgali': 15,
      'yakkasaroy': 4,
      'yashnobod': 10,
      'hamza': 10,
      'olmazor': 11,
      'sobir rahimov': 11,
      'shayxontohur': 6,
      'sheyxantahur': 6,
      'mirobod': 3,
      'uchtepa': 9,
      'akmal ikromov': 9,
      'bektemir': 18,
      'qoraqamish': 10,
      'qatar': 6,
      'qoqon': 240,
      'samarqand': 300,
      'buxoro': 550,
      'namangan': 290,
      'andijon': 350,
      'farg': 320
    };

    let foundDistance = null;
    for (const [key, val] of Object.entries(districts)) {
      if (addr.includes(key)) {
        foundDistance = val;
        break;
      }
    }

    if (foundDistance !== null) {
      setDistance(foundDistance);
    } else {
      // Stable hash fallback between 3 and 25
      let hash = 0;
      for (let i = 0; i < addr.length; i++) {
        hash = addr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const min = 3;
      const max = 25;
      const computed = min + Math.abs(hash % (max - min + 1));
      setDistance(computed);
    }
  };

  const handleNextToMethod = (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setFormError("Yetkazib berish manzilini kiriting");
      return;
    }
    setFormError('');
    setStep('method');
  };

  const handlePayViaClick = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('anjir-token');
      const res = await fetch('/api/payment/click/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookId: book.id,
          amount: totalAmount,
          distance: distance
        })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // Redirect to Click checkout portal
        window.location.href = data.url;
      } else {
        alert(data.error || "Click to'lov havolasini olishda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
      alert("Server bilan aloqa uzildi.");
    }
    setLoading(false);
  };

  const handleSimulatedCardSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length !== 16) {
      setFormError("Karta raqami 16 xonali bo'lishi kerak");
      return;
    }

    if (cardExpiry.length !== 5) {
      setFormError("Amal qilish muddati noto'g'ri (MM/YY)");
      return;
    }

    if (cardCvv.length < 3) {
      setFormError("CVC/CVV 3 xonali bo'lishi kerak");
      return;
    }

    if (!cardName.trim()) {
      setFormError("Karta egasining ismini kiriting");
      return;
    }

    setStep('processing');

    // Simulate Payment Gateway call + Create Order
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('anjir-token');
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user.id,
            bookId: book.id,
            bookTitle: title,
            price: totalAmount,
            userName: user.name,
            userPhone: user.phone,
            distance,
            deliveryFee,
            address
          })
        });

        if (res.ok) {
          setStep('success');
          if (onSuccess) onSuccess();
        } else {
          setStep('pay');
          setFormError("Buyurtmani rasmiylashtirishda xatolik yuz berdi.");
        }
      } catch (err) {
        setStep('pay');
        setFormError("Server bilan bog'lanishda xatolik.");
      }
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${styles.modal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.bookIcon}>🛍️</div>
          <h2 className={styles.title}>Kitob sotib olish</h2>
          <p className={styles.subtitle}>{title}</p>
        </div>

        {step === 'details' && (
          <form className={styles.form} onSubmit={handleNextToMethod}>
            <div className={styles.pricingSummary}>
              <div className={styles.priceRow}>
                <span>Kitob narxi:</span>
                <span>{basePrice.toLocaleString()} so'm</span>
              </div>
              <div className={styles.priceRow}>
                <span>Kuryer yetkazib berish ({distance} km):</span>
                <span>{deliveryFee.toLocaleString()} so'm</span>
              </div>
              <hr className={styles.divider} />
              <div className={`${styles.priceRow} ${styles.totalRow}`}>
                <span>Jami summa:</span>
                <span>{totalAmount.toLocaleString()} so'm</span>
              </div>
            </div>

            <div className={styles.field}>
              <label>
                Yetkazib berish manzili {addressLoading && <span className={styles.loadingPulse}>(aniqlanmoqda...)</span>}
              </label>
              <textarea
                className="textarea"
                rows="2"
                placeholder="Toshkent sh., Chilonzor tumani, 9-kvartal, 12-uy..."
                value={address}
                onChange={e => handleAddressChange(e.target.value)}
                required
              />
            </div>

            <div className={styles.mapWrapper}>
              <div id="delivery-map" className={styles.mapContainer}>
                {!mapLoaded && (
                  <div className={styles.mapPlaceholder}>
                    <div className={styles.mapSpinner}></div>
                    <span>Xarita yuklanmoqda...</span>
                  </div>
                )}
              </div>
              {mapLoaded && (
                <button
                  type="button"
                  className={styles.detectLocationBtn}
                  onClick={handleDetectLocation}
                  disabled={addressLoading}
                >
                  📡 Joylashuvimni aniqlash
                </button>
              )}
            </div>

            <div className={styles.distanceInfoBox}>
              <span className={styles.distanceIcon}>🚗</span>
              <div className={styles.distanceText}>
                <strong>Masofa:</strong> {distance > 0 ? `${distance} km` : "Manzilni kiriting yoki xaritadan tanlang..."}
                <span className={styles.distanceSub}> (Tizim avtomatik ravishda aniqladi)</span>
              </div>
            </div>

            {formError && <p className={styles.errorText}>{formError}</p>}

            <div className={styles.actions}>
              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                💳 To'lovga o'tish
              </button>
              <button type="button" className={styles.closeLink} onClick={onClose}>
                {t('close')}
              </button>
            </div>
          </form>
        )}

        {step === 'method' && (
          <div className={styles.paddedContent}>
            <div className={styles.backBtnRow}>
              <button className={styles.backBtn} onClick={() => setStep('details')}>← Orqaga</button>
              <span className={styles.paymentAmount}>Jami: <strong>{totalAmount.toLocaleString()} so'm</strong></span>
            </div>
            
            <h3 className={styles.methodTitle}>To'lov usulini tanlang</h3>
            
            <div className={styles.methodList}>
              <button 
                className={`btn btn-primary ${styles.methodBtn} ${styles.clickBtn}`} 
                onClick={handlePayViaClick} 
                disabled={loading}
              >
                🔵 {loading ? 'Yuklanmoqda...' : 'CLICK orqali sotib olish'}
              </button>
              
              <button 
                className={`btn btn-secondary ${styles.methodBtn}`} 
                onClick={() => setStep('pay')}
              >
                💳 Simulyatsiya to'lovi (Test)
              </button>
            </div>
          </div>
        )}

        {step === 'pay' && (
          <div className={styles.paddedContent}>
            <div className={styles.backBtnRow}>
              <button className={styles.backBtn} onClick={() => setStep('method')}>← Orqaga</button>
              <span className={styles.paymentAmount}>Jami: <strong>{totalAmount.toLocaleString()} so'm</strong></span>
            </div>

            {/* Virtual Card View */}
            <div className={styles.virtualCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardType}>UzCard / Humo / Visa</span>
                <span className={styles.cardChip}>📟</span>
              </div>
              <div className={styles.cardNumberDisplay}>
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className={styles.cardFooterDisplay}>
                <div className={styles.cardHolder}>
                  <label>CARD HOLDER</label>
                  <div>{cardName.toUpperCase() || 'NAME SURNAME'}</div>
                </div>
                <div className={styles.cardExpiryDisplay}>
                  <label>EXPIRES</label>
                  <div>{cardExpiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            <form className={styles.paymentForm} onSubmit={handleSimulatedCardSubmit}>
              <div className={styles.field}>
                <label>Karta raqami</label>
                <input
                  className="input"
                  type="text"
                  placeholder="8600 •••• •••• ••••"
                  maxLength="19"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label>Muddati</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="MM/YY"
                    maxLength="5"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label>CVC / CVV</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="•••"
                    maxLength="3"
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Karta egasining ismi</label>
                <input
                  className="input"
                  type="text"
                  placeholder="ISM FAMILIYA"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  required
                />
              </div>

              {formError && <p className={styles.errorText}>{formError}</p>}

              <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '10px' }}>
                💸 {totalAmount.toLocaleString()} so'm to'lash
              </button>
            </form>
          </div>
        )}

        {step === 'processing' && (
          <div className={styles.processingSection}>
            <div className={styles.spinner}></div>
            <h3>To'lov amalga oshirilmoqda...</h3>
            <p>Iltimos, sahifani yopmang yoki yangilamang.</p>
          </div>
        )}

        {step === 'success' && (
          <div className={styles.successSection}>
            <span className={styles.successIcon}>🎉</span>
            <h3>Xarid muvaffaqiyatli yakunlandi!</h3>
            <p>Buyurtma uchun <strong>{totalAmount.toLocaleString()} so'm</strong> yechildi.</p>
            <p className={styles.successSubtext}>Kuryer yetkazib berish uchun yo'lga chiqadi.</p>
            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>
              Tushunarli
            </button>
          </div>
        )}

        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
