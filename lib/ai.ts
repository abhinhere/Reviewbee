// ReviewBee AI Review Generation & Translation System

import { Settings, ReviewQuestion } from './db';

// Multi-lingual prompts & phrases to construct natural reviews if OpenAI is not configured
interface TranslationTemplates {
  welcome: string;
  ratingPhrases: Record<number, string[]>;
  emojiResponses: Record<string, string>;
  recommendationPhrases: Record<string, string>;
  connector: string;
  textPrefix: string;
  closing: string;
}

const TEMPLATES: Record<string, TranslationTemplates> = {
  en: {
    welcome: "I had a great time visiting this place.",
    ratingPhrases: {
      5: [
        "Absolutely outstanding experience!",
        "Highly impressed with the top-tier quality.",
        "One of the best experiences I have had recently.",
        "Exceptional service and setup.",
      ],
      4: [
        "Very nice experience here.",
        "Good environment and helpful setup.",
        "Satisfied with the overall experience.",
        "Pretty good service and facilities.",
      ],
      3: [
        "It was a decent experience.",
        "Service was alright.",
        "Average experience, met the basic expectations.",
        "Decent setup overall.",
      ],
      2: [
        "The experience could have been better.",
        "There is room for improvement.",
        "Okay, but did not meet my expectations.",
        "Service was a bit slow and lacking.",
      ],
      1: [
        "Disappointed with the experience.",
        "Needs serious improvement.",
        "Not satisfied with the service.",
        "Unfortunately, had a poor experience here.",
      ],
    },
    emojiResponses: {
      'friendly': "The staff was incredibly friendly and helpful.",
      'professional': "The team was highly professional and disciplined.",
      'average': "The customer support was standard.",
      'needs improvement': "Staff behavior needs some improvement.",
    },
    recommendationPhrases: {
      'yes': "I would definitely recommend them to others!",
      'maybe': "I might recommend them depending on what you seek.",
      'no': "I wouldn't really recommend them based on this visit.",
    },
    connector: "I particularly liked the ",
    textPrefix: "Regarding my experience: ",
    closing: "Will surely return again soon.",
  },
  ml: {
    // Malayalam
    welcome: "ഇവിടെ സന്ദർശിച്ചതിൽ എനിക്ക് വലിയ സന്തോഷമുണ്ട്.",
    ratingPhrases: {
      5: [
        "വളരെ മികച്ച അനുഭവം ആയിരുന്നു!",
        "സേവനങ്ങളുടെ ഗുണനിലവാരം എന്നെ വളരെയധികം ആകർഷിച്ചു.",
        "ഈ അടുത്ത കാലത്തുണ്ടായ ഏറ്റവും നല്ല അനുഭവങ്ങളിൽ ഒന്ന്.",
        "അസാധാരണമായ മികച്ച സേവനങ്ങളും സൗകര്യങ്ങളും.",
      ],
      4: [
        "വളരെ നല്ല അനുഭവമായിരുന്നു ഇവിടെ.",
        "നല്ല അന്തരീക്ഷവും മികച്ച രീതിയിലുള്ള ക്രമീകരണങ്ങളും.",
        "മൊത്തത്തിലുള്ള അനുഭവത്തിൽ ഞാൻ തൃപ്തനാണ്.",
        "കൊള്ളാം, നല്ല സേവനങ്ങളും സജ്ജീകരണങ്ങളും.",
      ],
      3: [
        "കുഴപ്പമില്ലാത്ത ഒരു അനുഭവമായിരുന്നു.",
        "സേവനങ്ങൾ തൃപ്തികരമായിരുന്നു.",
        "ശരാശരി അനുഭവം, അടിസ്ഥാന ആവശ്യങ്ങൾ നിറവേറ്റി.",
        "മൊത്തത്തിൽ കുഴപ്പമില്ലാത്ത ഒരു അനുഭവം.",
      ],
      2: [
        "അനുഭവം ഇതിലും മെച്ചപ്പെടാമായിരുന്നു.",
        "കുറെക്കൂടി മെച്ചപ്പെടേണ്ടതുണ്ട്.",
        "എന്റെ പ്രതീക്ഷകൾക്കൊത്ത് ഉയർന്നില്ല.",
        "സേവനങ്ങൾ കുറച്ചുകൂടി കാര്യക്ഷമമാക്കാമായിരുന്നു.",
      ],
      1: [
        "വളരെ നിരാശാജനകമായ അനുഭവമായിരുന്നു.",
        "വലിയ മാറ്റങ്ങൾ വരുത്തേണ്ടതുണ്ട്.",
        "സേവനത്തിൽ ഒട്ടും സംതൃപ്തനല്ല.",
        "നിർഭാഗ്യവശാൽ മോശം അനുഭവമാണ് എനിക്കുണ്ടായത്.",
      ],
    },
    emojiResponses: {
      'friendly': "ജീവനക്കാരെല്ലാം വളരെ സൗഹൃദപരമായും സഹായിക്കാനും തയ്യാറായിരുന്നു.",
      'professional': "അവിടുത്തെ ടീം വളരെ പ്രൊഫഷണലും അച്ചടക്കമുള്ളതുമാണ്.",
      'average': "കസ്റ്റമർ സപ്പോർട്ട് സാധാരണ നിലവാരത്തിലുള്ളതായിരുന്നു.",
      'needs improvement': "ജീവനക്കാരുടെ പെരുമാറ്റത്തിൽ ഇനിയും മെച്ചപ്പെടാനുണ്ട്.",
    },
    recommendationPhrases: {
      'yes': "മറ്റുള്ളവർക്ക് ഞാൻ ഇത് തീർച്ചയായും ശുപാർശ ചെയ്യുന്നു!",
      'maybe': "ചിലപ്പോൾ ഞാൻ ശുപാർശ ചെയ്തേക്കാം.",
      'no': "ഇവിടെ സന്ദർശിച്ചതിന്റെ അടിസ്ഥാനത്തിൽ ഞാൻ ഇത് ശുപാർശ ചെയ്യില്ല.",
    },
    connector: "എനിക്ക് ഏറ്റവും ഇഷ്ടപ്പെട്ടത് ഇതാണ്: ",
    textPrefix: "എന്റെ അനുഭവം പങ്കുവെച്ചാൽ: ",
    closing: "തീർച്ചയായും വീണ്ടും വരും.",
  },
  hi: {
    // Hindi
    welcome: "यहाँ का मेरा अनुभव बहुत ही अच्छा रहा।",
    ratingPhrases: {
      5: [
        "बिल्कुल उत्कृष्ट अनुभव!",
        "यहाँ की उच्च गुणवत्ता से बहुत प्रभावित हूँ।",
        "हाल ही में मिले सबसे बेहतरीन अनुभवों में से एक।",
        "असाधारण सेवा और बेहतरीन व्यवस्था।",
      ],
      4: [
        "यहाँ बहुत अच्छा अनुभव रहा।",
        "अच्छा माहौल और मददगार व्यवस्था।",
        "समग्र अनुभव से पूरी तरह संतुष्ट हूँ।",
        "काफी अच्छी सेवा और सुविधाएँ।",
      ],
      3: [
        "यह एक ठीक-ठाक अनुभव था।",
        "सेवा ठीक थी।",
        "औसत अनुभव, बुनियादी उम्मीदों पर खरा उतरा।",
        "कुल मिलाकर सामान्य व्यवस्था थी।",
      ],
      2: [
        "अनुभव और बेहतर हो सकता था।",
        "सुधार की काफी गुंजाइश है।",
        "ठीक था, लेकिन मेरी उम्मीदों के मुताबिक नहीं रहा।",
        "सेवा थोड़ी धीमी और कमतर थी।",
      ],
      1: [
        "अनुभव से बहुत निराशा हुई।",
        "गंभीर सुधार की आवश्यकता है।",
        "यहाँ की सेवा से संतुष्ट नहीं हूँ।",
        "दुर्भाग्य से, यहाँ का अनुभव काफी खराब रहा।",
      ],
    },
    emojiResponses: {
      'friendly': "यहाँ का स्टाफ बेहद मिलनसार और मददगार था।",
      'professional': "पूरी टीम बहुत पेशेवर और अनुशासित थी।",
      'average': "ग्राहक सहायता सामान्य स्तर की थी।",
      'needs improvement': "कर्मचारियों के व्यवहार में कुछ सुधार की आवश्यकता है।",
    },
    recommendationPhrases: {
      'yes': "मैं दूसरों को यहाँ आने की दृढ़ता से सिफारिश करूँगा!",
      'maybe': "मैं शायद दूसरों को यहाँ आने का सुझाव दे सकता हूँ।",
      'no': "इस दौरे के आधार पर मैं इसकी सिफारिश नहीं करूँगा।",
    },
    connector: "मुझे विशेष रूप से पसंद आया: ",
    textPrefix: "मेरे अनुभव के बारे में: ",
    closing: "जल्द ही फिर से यहाँ आऊँगा।",
  },
  ar: {
    // Arabic
    welcome: "كانت زيارتي لهذا المكان تجربة رائعة للغاية.",
    ratingPhrases: {
      5: [
        "تجربة ممتازة واستثنائية بكل المقاييس!",
        "منبهر جداً بالخدمة ذات الجودة العالية.",
        "واحدة من أفضل التجارب التي مررت بها مؤخراً.",
        "خدمة وتجهيزات استثنائية تفوق التوقعات.",
      ],
      4: [
        "تجربة جيدة جداً هنا.",
        "بيئة جميلة وتجهيزات مفيدة.",
        "راضٍ تماماً عن التجربة الإجمالية.",
        "خدمة ومرافق جيدة إلى حد كبير.",
      ],
      3: [
        "كانت تجربة عادية.",
        "الخدمة كانت مقبولة.",
        "تجربة متوسطة تلبي التوقعات الأساسية فقط.",
        "تجهيزات مقبولة بشكل عام.",
      ],
      2: [
        "كان من الممكن أن تكون التجربة أفضل بكثير.",
        "هناك مجال كبير للتحسين والتطوير.",
        "جيد، لكنه لم يلبِ مستوى توقعاتي.",
        "الخدمة كانت بطيئة نوعاً ما وتحتاج لاهتمام.",
      ],
      1: [
        "تجربة مخيبة للآمال للغاية.",
        "تحتاج إلى تحسينات وتعديلات جادة فوراً.",
        "غير راضٍ عن الخدمة المقدمة.",
        "للأسف، كانت تجربتي هنا سيئة للغاية.",
      ],
    },
    emojiResponses: {
      'friendly': "طاقم العمل كان ودوداً للغاية ومتعاوناً بشكل كبير.",
      'professional': "كان الفريق محترفاً جداً ومنضبطاً في عمله.",
      'average': "كان دعم العملاء عادياً وضمن الحدود المقبولة.",
      'needs improvement': "سلوك الموظفين بحاجة إلى بعض التطوير والتحسين.",
    },
    recommendationPhrases: {
      'yes': "أوصي بزيارة هذا المكان بشدة للجميع!",
      'maybe': "قد أوصي بزيارته بناءً على ما تبحث عنه.",
      'no': "لا أنصح بزيارته بناءً على هذه التجربة الشخصية.",
    },
    connector: "لقد أعجبني بشكل خاص: ",
    textPrefix: "فيما يتعلق بتجربتي: ",
    closing: "سأكرر الزيارة بالتأكيد في المستقبل القريب.",
  },
};

export async function generateAIdraft({
  tone,
  length,
  language,
  rating,
  answers,
  questions,
}: {
  tone: Settings['ai_writing_tone'];
  length: Settings['ai_review_length'];
  language: string;
  rating: number;
  answers: Record<string, any>;
  questions: ReviewQuestion[];
}): Promise<string> {
  // If OpenAI config key is in env variables, we could call API,
  // but to keep it fully clientside & instant (or server route fallback), we implement the premium heuristic generator.
  
  // Format target language key
  const langKey = (TEMPLATES[language] ? language : 'en') as keyof typeof TEMPLATES;
  const temp = TEMPLATES[langKey];

  // Select rating sentence randomly to keep reviews unique and human-like
  const ratingGroup = temp.ratingPhrases[rating as number] || temp.ratingPhrases[5];
  const ratingSentence = ratingGroup[Math.floor(Math.random() * ratingGroup.length)];

  const reviewParts: string[] = [];
  
  // First sentence
  reviewParts.push(ratingSentence);

  // Identify multiple choice answers (facilities, services, etc.)
  const multiAnswers: string[] = [];
  const singleAnswers: string[] = [];
  let emojiAnswer = '';
  let textInputAnswer = '';

  questions.forEach((q) => {
    const ans = answers[q.id];
    if (!ans) return;

    if (q.question_type === 'multiple_choice' && Array.isArray(ans)) {
      multiAnswers.push(...ans);
    } else if (q.question_type === 'single_choice') {
      singleAnswers.push(ans);
    } else if (q.question_type === 'emoji_selection') {
      emojiAnswer = String(ans).toLowerCase();
    } else if (q.question_type === 'text_input') {
      textInputAnswer = String(ans);
    }
  });

  // Staff behavior (Emoji selection response)
  if (emojiAnswer) {
    let matchedEmojiKey = '';
    if (emojiAnswer.includes('friendly') || emojiAnswer.includes('😊') || emojiAnswer.includes('സൗഹൃദ')) {
      matchedEmojiKey = 'friendly';
    } else if (emojiAnswer.includes('profess') || emojiAnswer.includes('👍')) {
      matchedEmojiKey = 'professional';
    } else if (emojiAnswer.includes('aver') || emojiAnswer.includes('😐')) {
      matchedEmojiKey = 'average';
    } else if (emojiAnswer.includes('improv') || emojiAnswer.includes('🙁')) {
      matchedEmojiKey = 'needs improvement';
    }

    if (matchedEmojiKey && temp.emojiResponses[matchedEmojiKey]) {
      reviewParts.push(temp.emojiResponses[matchedEmojiKey]);
    }
  }

  // Services/items chosen
  if (multiAnswers.length > 0) {
    const listString = multiAnswers.join(', ');
    reviewParts.push(`${temp.connector}${listString}.`);
  }

  // Recommendations
  if (singleAnswers.length > 0) {
    const recVal = singleAnswers[0].toLowerCase();
    let recKey = 'maybe';
    if (recVal.includes('yes') || recVal.includes('തീർച്ചയായും') || recVal.includes('हाँ') || recVal.includes('نعم')) {
      recKey = 'yes';
    } else if (recVal.includes('no') || recVal.includes('ഇല്ല') || recVal.includes('नहीं') || recVal.includes('لا')) {
      recKey = 'no';
    }
    reviewParts.push(temp.recommendationPhrases[recKey]);
  }

  // Text input comments
  if (textInputAnswer && textInputAnswer.trim().length > 3) {
    // If they typed something custom, append it cleanly
    reviewParts.push(`"${textInputAnswer.trim()}"`);
  }

  // Closing
  if (rating >= 4) {
    reviewParts.push(temp.closing);
  }

  // Tone adjustments (prefixes, suffixes, styling)
  let joinedText = reviewParts.join(' ');

  if (tone === 'luxury') {
    if (langKey === 'en') {
      joinedText = `A truly exquisite visit. ${joinedText} Highly refined experience.`;
    } else if (langKey === 'ml') {
      joinedText = `വളരെ ആഡംബരവും മനോഹരവുമായ അന്തരീക്ഷം. ${joinedText}`;
    } else if (langKey === 'hi') {
      joinedText = `सचमुच एक शानदार और भव्य अनुभव। ${joinedText}`;
    } else if (langKey === 'ar') {
      joinedText = `تجربة راقية وفاخرة للغاية. ${joinedText}`;
    }
  } else if (tone === 'professional') {
    if (langKey === 'en') {
      joinedText = `Highly professional service standard. ${joinedText}`;
    } else if (langKey === 'ar') {
      joinedText = `خدمة على مستوى عالٍ من الاحترافية والالتزام. ${joinedText}`;
    }
  } else if (tone === 'simple') {
    // Shorten or simplify sentences
    joinedText = joinedText.replace(/Absolutely outstanding|Exceptional|അസാധാരണമായ|असाधारण/g, 'Good');
  }

  // Length adjustments
  if (length === 'short') {
    // Limit to 2 sentences
    const sentences = joinedText.split(/[.!?]+/);
    joinedText = sentences.slice(0, 2).join('. ') + '.';
  } else if (length === 'long' && langKey === 'en') {
    joinedText = `${joinedText} The attention to detail was remarkable, and they went above and beyond to make sure everything was perfect. We will be sharing this with our friends.`;
  }

  return joinedText;
}
