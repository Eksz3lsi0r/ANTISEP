
export const translateText = async (text, sourceLang, targetLang) => {
  if (!text) return '';
  if (sourceLang === targetLang) return text;

  // Basic cleaning of lang codes (e.g., 'en-US' -> 'en')
  const source = sourceLang.split('-')[0];
  const target = targetLang.split('-')[0];

  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`);
    const data = await response.json();
    
    if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
    }
    throw new Error('Invalid response');
  } catch (error) {
    console.error("Translation failed:", error);
    return `[${target}] ${text}`; // Fallback mock
  }
};
