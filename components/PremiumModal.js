'use client';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './PremiumModal.module.css';

export default function PremiumModal({ onClose }) {
  const { t } = useLanguage();
  const { user, checkAuth } = useAuth();
  
  const [step, setStep] = useState('select'); // 'select', 'method', 'pay', 'processing', 'success'
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Card form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [formError, setFormError] = useState('');

  const packages = [
    { key: 1, label: t('package1Month'), value: 1, price: 20000, priceStr: "20 000 so'm" },
    { key: 3, label: t('package3Month'), value: 3, price: 80000, priceStr: "80 000 so'm" },
    { key: 9, label: t('package9Month'), value: 9, price: 200000, priceStr: "200 000 so'm" }
  ];

  const selectedPackage = packages.find(p => p.value === months);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handleNextToMethod = () => {
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
        body: JSON.stringify({ months })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // Redirect to Click payment portal
        window.location.href = data.url;
      } else {
        alert(data.error || "Click to'lov manzilini olishda xatolik");
      }
    } catch (err) {
      console.error(err);
      alert("Aloqa xatosi");
    }
    setLoading(false);
  };

  const handlePaymentSubmit = async (e) => {
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

    // Start simulated processing
    setStep('processing');
    
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('anjir-token');
        const res = await fetch('/api/users/premium', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ months })
        });
        
        if (res.ok) {
          await checkAuth(); // Refresh user context
          setStep('success');
        } else {
          setStep('pay');
          setFormError("To'lovni amalga oshirishda xatolik yuz berdi. Qayta urinib ko'ring.");
        }
      } catch (err) {
        setStep('pay');
        setFormError("Server bilan aloqa uzildi.");
      }
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${styles.premium}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.crown}>👑</div>
          <h2 className={styles.title}>{t('premiumTitle')}</h2>
          <p className={styles.subtitle}>{t('premiumSubtitle')}</p>
        </div>

        {step === 'select' && (
          <>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>📚</span>
                <span>{t('premiumFeature1')}</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🚫</span>
                <span>{t('premiumFeature2')}</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>⚡</span>
                <span>{t('premiumFeature3')}</span>
              </div>
            </div>

            <div className={styles.packagesSection}>
              <h4 className={styles.packagesTitle}>{t('buyPremiumPackage')}</h4>
              <div className={styles.packagesList}>
                {packages.map(p => (
                  <div
                    key={p.key}
                    className={`${styles.packageCard} ${months === p.value ? styles.packageActive : ''}`}
                    onClick={() => setMonths(p.value)}
                  >
                    <div className={styles.packageRadio}>
                      <span className={months === p.value ? styles.radioInner : ''}></span>
                    </div>
                    <div className={styles.packageInfo}>
                      <span className={styles.packageName}>{p.value} oy</span>
                      <span className={styles.packagePrice}>{p.priceStr}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button className={`btn btn-primary ${styles.buyBtn}`} onClick={handleNextToMethod}>
                💳 Davom etish
              </button>
              <button className={styles.closeLink} onClick={onClose}>
                {t('close')}
              </button>
            </div>
          </>
        )}

        {step === 'method' && (
          <div className={styles.paymentSection}>
            <div className={styles.backBtnRow}>
              <button className={styles.backBtn} onClick={() => setStep('select')}>← Orqaga</button>
              <span className={styles.paymentAmount}>To'lov: <strong>{selectedPackage?.priceStr}</strong></span>
            </div>
            
            <h3 className={styles.methodTitle}>To'lov usulini tanlang</h3>
            
            <div className={styles.methodList}>
              <button 
                className={`btn btn-primary ${styles.methodBtn} ${styles.clickBtn}`} 
                onClick={handlePayViaClick} 
                disabled={loading}
              >
                🔵 {loading ? 'Yuklanmoqda...' : 'CLICK orqali to\'lash'}
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
          <div className={styles.paymentSection}>
            <div className={styles.backBtnRow}>
              <button className={styles.backBtn} onClick={() => setStep('method')}>← Orqaga</button>
              <span className={styles.paymentAmount}>To'lov: <strong>{selectedPackage?.priceStr}</strong></span>
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

            <form className={styles.paymentForm} onSubmit={handlePaymentSubmit}>
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
                💸 {selectedPackage?.priceStr} to'lash
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
            <h3>To'lov muvaffaqiyatli yakunlandi!</h3>
            <p>Kartangizdan <strong>{selectedPackage?.priceStr}</strong> yechildi.</p>
            <p className={styles.successSubtext}>Premium obuna {months} oyga faollashtirildi.</p>
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
