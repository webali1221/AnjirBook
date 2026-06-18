'use client';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './PremiumModal.module.css';

export default function PremiumModal({ onClose }) {
  const { t, lang } = useLanguage();
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

        <div className={styles.packagesSection}>
          <h4 className={styles.packagesTitle}>{t('buyPremiumPackage')}</h4>
          <div className={styles.packagesList}>
            {packages.map(p => (
              <div key={p.key} className={styles.packageCardStatic}>
                <div className={styles.packageInfo}>
                  <span className={styles.packageName}>{p.value} oy</span>
                  <span className={styles.packagePrice}>{p.priceStr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.contactSection}>
          <p className={styles.contactText}>
            {lang === 'ru' 
              ? 'Для покупки Премиум напишите нам в Telegram:' 
              : 'Premium sotib olish uchun telegram orqali bizga yozing:'}
          </p>
          <a href="https://t.me/AL_JALOLIDDIN" className={styles.telegramLink} target="_blank">
            ✈️ @AL_JALOLIDDIN
          </a>
          <p className={styles.contactHint}>
            {lang === 'ru'
              ? 'После подтверждения оплаты Премиум будет активирован в течение 5-10 минут.'
              : "To'lovni tasdiqlaganingizdan so'ng, premium 5-10 daqiqa ichida faollashtirib beriladi."}
          </p>
        </div>

        <div className={styles.actions}>
          <button className={`btn btn-secondary ${styles.closeBtnLink}`} onClick={onClose}>
            {t('close')}
          </button>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
