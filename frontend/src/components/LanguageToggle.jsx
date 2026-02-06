export default function LanguageToggle({ language, onChange }) {
  return (
    <div className="language-toggle">
      <button
        type="button"
        className={language === 'en' ? 'active' : ''}
        onClick={() => onChange('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={language === 'ar' ? 'active arabic' : 'arabic'}
        onClick={() => onChange('ar')}
      >
        عربي
      </button>
    </div>
  )
}
