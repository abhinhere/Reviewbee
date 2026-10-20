'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ArrowRight, ArrowLeft, Languages, ClipboardCheck, Sparkles, RefreshCw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { mockDb, isSupabaseConfigured, supabase, Organization, Branch, Settings, ReviewQuestion } from '@/lib/db';
import { generateAIdraft } from '@/lib/ai';

type Params = Promise<{ orgSlug: string; branchSlug: string }>;

export default function CustomerReviewPage({ params }: { params: Params }) {
  const router = useRouter();
  const { orgSlug, branchSlug } = use(params);

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<number>(1); // 1: Welcome, 2: Lang, 3: Questions, 4: AI Gen, 5: Preview/Edit, 6: Redirect/Success
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  
  // Wizard Answers State
  const [overallRating, setOverallRating] = useState<number>(5);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  
  // AI Generated Text States
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [reviewId, setReviewId] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Load Business Config
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        let orgData: Organization | undefined;
        let branchData: Branch | undefined;
        let settingsData: Settings | undefined;
        let questionsData: ReviewQuestion[] = [];

        if (isSupabaseConfigured && supabase) {
          // Fetch from Supabase
          const { data: orgs, error: oe } = await supabase
            .from('organizations')
            .select('*')
            .eq('slug', orgSlug)
            .single();
          
          if (oe || !orgs) throw new Error('Organization not found');
          orgData = orgs;

          const { data: branches, error: be } = await supabase
            .from('branches')
            .select('*')
            .eq('organization_id', orgs.id)
            .eq('slug', branchSlug)
            .single();

          if (be || !branches) throw new Error('Branch not found');
          branchData = branches;

          const { data: setts } = await supabase
            .from('settings')
            .select('*')
            .eq('organization_id', orgs.id)
            .single();
          settingsData = setts || undefined;

          const { data: qlist } = await supabase
            .from('review_questions')
            .select('*')
            .eq('organization_id', orgs.id)
            .eq('is_enabled', true)
            .order('sort_order', { ascending: true });
          questionsData = qlist || [];
        } else {
          // Fetch from Local Mock DB
          orgData = mockDb.getOrganizationBySlug(orgSlug);
          if (!orgData) throw new Error('Demo organization not found');

          branchData = mockDb.getBranchBySlug(orgSlug, branchSlug);
          if (!branchData) throw new Error('Demo branch not found');

          settingsData = mockDb.getSettings(orgData.id);
          questionsData = mockDb.getQuestions(orgData.id).filter((q) => q.is_enabled);
        }

        if (!orgData || !branchData) {
          throw new Error('Organization or branch not found');
        }

        // Provide default questions if organization has no questions configured
        if (!questionsData || questionsData.length === 0) {
          questionsData = [
            {
              id: 'q-def-1',
              question_set_id: 'qset-default',
              organization_id: orgData.id,
              question_text: {
                en: 'What did you like most about your visit today?',
                ml: 'ഇന്നത്തെ സന്ദർശനത്തിൽ നിങ്ങൾക്ക് ഏറ്റവും ഇഷ്ടപ്പെട്ടത് എന്താണ്?',
                hi: 'आज की आपकी यात्रा में आपको सबसे ज्यादा क्या पसंद आया?',
                ar: 'ما الذي أعجبك أكثر في زيارتك اليوم؟',
              },
              question_type: 'multiple_choice',
              options: {
                en: ['Quality of Service', 'Friendly Staff', 'Great Atmosphere', 'Value for Money', 'Cleanliness'],
                ml: ['സേവന നിലവാരം', 'സൗഹൃദപരമായ പെരുമാറ്റം', 'നല്ല അന്തരീക്ഷം', 'ന്യായമായ നിരക്ക്', 'വൃത്തി'],
                hi: ['सेवा की गुणवत्ता', 'मिलनसार स्टाफ', 'शानदार माहौल', 'पैसे की सही कीमत', 'स्वच्छता'],
                ar: ['جودة الخدمة', 'طاقم العمل الودود', 'الأجواء الرائعة', 'القيمة مقابل المال', 'النظافة'],
              },
              is_required: false,
              sort_order: 1,
              is_enabled: true,
            },
            {
              id: 'q-def-2',
              question_set_id: 'qset-default',
              organization_id: orgData.id,
              question_text: {
                en: 'How was the service speed and hospitality?',
                ml: 'സേവനത്തിന്റെ വേഗതയും ആതിഥ്യമര്യാദയും എങ്ങനെയുണ്ടായിരുന്നു?',
                hi: 'सेवा की गति और आतिथ्य कैसा था?',
                ar: 'كيف كانت سرعة الخدمة والضيافة؟',
              },
              question_type: 'emoji_selection',
              options: {
                en: ['Super Fast ⚡', 'Friendly & Welcoming 😊', 'Good 👍', 'Average 😐'],
                ml: ['വളരെ വേഗത്തിൽ ⚡', 'സൗഹൃദപരം 😊', 'കൊള്ളാം 👍', 'ശരാശരി 😐'],
                hi: ['बहुत तेज़ ⚡', 'मिलनसार 😊', 'अच्छा 👍', 'सामान्य 😐'],
                ar: ['سريع جداً ⚡', 'ودود ومرحب 😊', 'جيد 👍', 'متوسط 😐'],
              },
              is_required: false,
              sort_order: 2,
              is_enabled: true,
            },
          ];
        }

        setOrganization(orgData);
        setBranch(branchData);
        setSettings(settingsData || {
          id: 'def',
          organization_id: orgData.id,
          ai_writing_tone: 'friendly',
          ai_review_length: 'medium',
          enabled_languages: ['en'],
        });
        setQuestions(questionsData);
        
        // Track scan event
        if (branchData) {
          mockDb.recordEvent(branchData.id, 'qr_scan');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error loading page');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orgSlug, branchSlug]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <Sparkles className="w-5 h-5 text-blue-600 absolute animate-pulse" />
        </div>
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Loading ReviewBee Flow...</p>
      </div>
    );
  }

  if (error || !organization || !branch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
          <Star className="w-8 h-8 fill-current" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Business Page Not Found</h1>
        <p className="text-slate-500 mt-2 max-w-sm text-sm">
          Please check the URL. The business slug or branch code you provided is invalid.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  // --- Dynamic Color Configurations ---
  const primaryColor = branch.primary_color || organization.primary_color || '#3B82F6';

  // Translating prompt text
  const UI_TEXT: Record<string, any> = {
    en: {
      welcomeTitle: `Welcome to ${branch.name}`,
      welcomeSubtitle: "Loved your experience? Answer 4 quick questions to help others discover us.",
      startBtn: "Start Review",
      langSelect: "Select Your Language",
      langSubtitle: "Choose the language in which you prefer to write your review",
      prevBtn: "Back",
      nextBtn: "Continue",
      submitBtn: "Generate AI Review",
      ratingTitle: "Overall Rating",
      ratingSubtitle: "Select your review score to begin",
      generating: "AI ReviewBee is drafting your review...",
      generatingSubtitle: "Drafting in natural words based on your inputs",
      previewTitle: "Your AI review is ready!",
      previewSubtitle: "Review and edit the text. Tapping continue will copy it and open our Google Review page.",
      copyBtn: "Copy & Open Google Review",
      copiedText: "Review copied to clipboard! Redirecting you now...",
      pasteInstructions: "1. The review text has been copied to your clipboard.\n2. In the Google page, tap the stars and Paste your review.",
      redirectPrompt: "If you are not redirected automatically, tap the button below:",
      redirectBtn: "Go to Google Review Page",
      regenerate: "Regenerate",
      rewrite: "Rewrite",
      requiredAlert: "Please answer this required question before continuing",
    },
    ml: {
      welcomeTitle: `${branch.name}-ലേക്ക് സ്വാഗതം`,
      welcomeSubtitle: "നിങ്ങൾക്ക് ഞങ്ങളുടെ സേവനം ഇഷ്ടപ്പെട്ടോ? മറ്റുള്ളവർക്ക് ഞങ്ങളെ കണ്ടെത്താൻ സഹായിക്കുന്നതിന് 4 ലളിതമായ ചോദ്യങ്ങൾക്ക് മറുപടി നൽകുക.",
      startBtn: "റിവ്യൂ ആരംഭിക്കുക",
      langSelect: "ഭാഷ തിരഞ്ഞെടുക്കുക",
      langSubtitle: "നിങ്ങളുടെ അഭിപ്രായം ഏത് ഭാഷയിൽ എഴുതാനാണ് ആഗ്രഹിക്കുന്നത് എന്ന് തിരഞ്ഞെടുക്കുക",
      prevBtn: "പുറകോട്ട്",
      nextBtn: "തുടരുക",
      submitBtn: "AI റിവ്യൂ തയ്യാറാക്കുക",
      ratingTitle: "മൊത്തത്തിലുള്ള റേറ്റിംഗ്",
      ratingSubtitle: "തുടങ്ങുന്നതിനായി റേറ്റിംഗ് തിരഞ്ഞെടുക്കുക",
      generating: "AI റിവ്യൂ തയ്യാറാക്കുന്നു...",
      generatingSubtitle: "നിങ്ങളുടെ ഉത്തരങ്ങളുടെ അടിസ്ഥാനത്തിൽ ലളിതമായ വാക്കുകളിൽ എഴുതുന്നു",
      previewTitle: "നിങ്ങളുടെ AI റിവ്യൂ തയ്യാറാണ്!",
      previewSubtitle: "നിങ്ങൾക്ക് ആവശ്യമായ മാറ്റങ്ങൾ വരുത്താം. താഴെ കാണുന്ന ബട്ടണിൽ ക്ലിക്ക് ചെയ്താൽ റിവ്യൂ കോപ്പി ചെയ്യപ്പെടുകയും ഗൂഗിൾ റിവ്യൂ പേജ് തുറക്കുകയും ചെയ്യും.",
      copyBtn: "കോപ്പി ചെയ്ത് ഗൂഗിൾ തുറക്കുക",
      copiedText: "റിവ്യൂ കോപ്പി ചെയ്തു! ഗൂഗിൾ പേജിലേക്ക് പോകുന്നു...",
      pasteInstructions: "1. റിവ്യൂ നിങ്ങളുടെ ക്ലിപ്ബോർഡിലേക്ക് കോപ്പി ചെയ്തിട്ടുണ്ട്.\n2. ഗൂഗിൾ റിവ്യൂ പേജിൽ സ്റ്റാറുകൾ സെലക്ട് ചെയ്ത ശേഷം പേസ്റ്റ് (Paste) ചെയ്യുക.",
      redirectPrompt: "ഗൂഗിൾ പേജ് ഓട്ടോമാറ്റിക് ആയി തുറന്നില്ലെങ്കിൽ താഴെയുള്ള ബട്ടണിൽ അമർത്തുക:",
      redirectBtn: "ഗൂഗിൾ റിവ്യൂ പേജിലേക്ക് പോവുക",
      regenerate: "വീണ്ടും നിർമ്മിക്കുക",
      rewrite: "തിരുത്തുക",
      requiredAlert: "തുടരുന്നതിന് മുമ്പ് ഈ ചോദ്യത്തിന് മറുപടി നൽകുക",
    },
    hi: {
      welcomeTitle: `${branch.name} में आपका स्वागत है`,
      welcomeSubtitle: "क्या आपको हमारा अनुभव पसंद आया? दूसरों को हमारी खोज करने में मदद करने के लिए 4 त्वरित प्रश्नों के उत्तर दें।",
      startBtn: "समीक्षा शुरू करें",
      langSelect: "अपनी भाषा चुनें",
      langSubtitle: "वह भाषा चुनें जिसमें आप अपनी समीक्षा लिखना पसंद करते हैं",
      prevBtn: "पीछे",
      nextBtn: "आगे बढ़ें",
      submitBtn: "AI समीक्षा उत्पन्न करें",
      ratingTitle: "कुल मिलाकर रेटिंग",
      ratingSubtitle: "समीक्षा शुरू करने के लिए अपना स्कोर चुनें",
      generating: "AI आपकी समीक्षा का मसौदा तैयार कर रहा है...",
      generatingSubtitle: "आपके उत्तरों के आधार पर प्राकृतिक शब्दों में लिखा जा रहा है",
      previewTitle: "आपकी AI समीक्षा तैयार है!",
      previewSubtitle: "समीक्षा को संपादित करें। आगे बढ़ने पर यह कॉपी हो जाएगा और हमारा गूगल समीक्षा पेज खुल जाएगा।",
      copyBtn: "कॉपी करें और गूगल समीक्षा खोलें",
      copiedText: "समीक्षा कॉपी हो गई! गूगल पेज पर जा रहे हैं...",
      pasteInstructions: "1. समीक्षा टेक्स्ट को आपके क्लिपबोर्ड पर कॉपी कर दिया गया है।\n2. गूगल पेज पर, स्टार रेटिंग चुनें और समीक्षा पेस्ट करें।",
      redirectPrompt: "यदि आप स्वचालित रूप से रीडायरेक्ट नहीं होते हैं, तो नीचे दिए गए बटन पर टैप करें:",
      redirectBtn: "गूगल समीक्षा पृष्ठ पर जाएं",
      regenerate: "पुनः उत्पन्न करें",
      rewrite: "संशोधित करें",
      requiredAlert: "जारी रखने से पहले कृपया इस आवश्यक प्रश्न का उत्तर दें",
    },
    ar: {
      welcomeTitle: `مرحباً بك في ${branch.name}`,
      welcomeSubtitle: "هل أعجبتك تجربتك معنا؟ أجب عن 4 أسئلة سريعة لمساعدة الآخرين في التعرف علينا.",
      startBtn: "ابدأ التقييم",
      langSelect: "اختر لغتك المفضلة",
      langSubtitle: "اختر اللغة التي تفضل كتابة التقييم بها",
      prevBtn: "رجوع",
      nextBtn: "استمرار",
      submitBtn: "توليد التقييم بالذكاء الاصطناعي",
      ratingTitle: "التقييم العام",
      ratingSubtitle: "اختر مستوى رضاك للبدء",
      generating: "يجري إعداد تقييمك الذكي حالياً...",
      generatingSubtitle: "صياغة التقييم بكلمات طبيعية بناءً على إجاباتك",
      previewTitle: "تقييمك الذكي جاهز الآن!",
      previewSubtitle: "راجع النص وقم بتعديله إن أردت. الضغط على استمرار سيقوم بنسخ النص وفتح صفحة تقييمات جوجل مباشرة.",
      copyBtn: "نسخ وفتح صفحة التقييمات",
      copiedText: "تم نسخ النص بنجاح! يتم الآن توجيهك إلى جوجل...",
      pasteInstructions: "1. تم نسخ نص التقييم إلى حافظة هاتفك تلقائياً.\n2. في صفحة جوجل، حدد النجوم ثم اضغط باستمرار لإلصاق النص.",
      redirectPrompt: "إذا لم يتم توجيهك تلقائياً، اضغط على زر التوجيه أدناه:",
      redirectBtn: "انتقل إلى صفحة تقييمات جوجل",
      regenerate: "توليد جديد",
      rewrite: "إعادة صياغة",
      requiredAlert: "يرجى الإجابة على هذا السؤال الإلزامي للمتابعة",
    },
  };

  const currentUiText = UI_TEXT[selectedLanguage] || UI_TEXT['en'];
  const isRtl = selectedLanguage === 'ar';

  const availableLanguages = (settings?.enabled_languages || ['en']).map((l) => {
    switch (l) {
      case 'en': return { code: 'en', label: 'English', native: 'English' };
      case 'ml': return { code: 'ml', label: 'Malayalam', native: 'മലയാളം' };
      case 'hi': return { code: 'hi', label: 'Hindi', native: 'हिन्दी' };
      case 'ar': return { code: 'ar', label: 'Arabic', native: 'العربية' };
      default: return { code: l, label: l, native: l };
    }
  });

  // --- Wizards Logic ---

  const handleStartReview = () => {
    // Start session
    const sess = mockDb.createReviewSession(branch.id, selectedLanguage);
    setSessionId(sess.id);
    mockDb.recordEvent(branch.id, 'session_start');
    
    // Check if there are active enabled languages. If only one language is configured, skip selection screen
    if (availableLanguages.length <= 1) {
      setSelectedLanguage(availableLanguages[0]?.code || 'en');
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleSelectLanguage = (langCode: string) => {
    setSelectedLanguage(langCode);
    setStep(3);
  };

  const handleRatingSelect = (ratingVal: number) => {
    setOverallRating(ratingVal);
  };

  const handleAnswerSelect = (questionId: string, value: any, isMultiple = false) => {
    setAnswers((prev) => {
      if (isMultiple) {
        const current = prev[questionId] || [];
        if (current.includes(value)) {
          return { ...prev, [questionId]: current.filter((v: any) => v !== value) };
        } else {
          return { ...prev, [questionId]: [...current, value] };
        }
      }
      return { ...prev, [questionId]: value };
    });
  };

  const handleNextQuestion = () => {
    // Verify required validation
    if (currentQuestionIndex === 0) {
      // First virtual question: star rating
      if (!questions || questions.length === 0) {
        generateReviewText();
        return;
      }
      setCurrentQuestionIndex(1);
    } else {
      const activeQ = questions && questions[currentQuestionIndex - 1];
      if (activeQ && activeQ.is_required && !answers[activeQ.id]) {
        alert(currentUiText.requiredAlert);
        return;
      }

      if (currentQuestionIndex < questions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // We reached the end of the survey! Trigger generation.
        generateReviewText();
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      setStep(availableLanguages.length <= 1 ? 1 : 2);
    }
  };

  const generateReviewText = async () => {
    setStep(4);
    if (!branch) return;
    setIsGenerating(true);
    try {
      // API request to server route
      const response = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone: settings?.ai_writing_tone || 'friendly',
          length: settings?.ai_review_length || 'medium',
          language: selectedLanguage,
          rating: overallRating,
          answers,
          questions,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setGeneratedText(resData.text);
        
        // Save generated review
        const createdRev = mockDb.createGeneratedReview({
          review_session_id: sessionId,
          branch_id: branch.id,
          original_text: resData.text,
          edited_text: resData.text,
          rating: overallRating,
          language: selectedLanguage,
        });
        setReviewId(createdRev.id);
        
        // Save review status to mock session
        mockDb.updateReviewSession(sessionId, overallRating, answers, true);
        mockDb.recordEvent(branch.id, 'review_generated');
      } else {
        throw new Error('AI Generation failed');
      }
    } catch (err) {
      console.error(err);
      // Client-side fallback generator in case API fails
      const fallbackText = await generateAIdraft({
        tone: settings?.ai_writing_tone || 'friendly',
        length: settings?.ai_review_length || 'medium',
        language: selectedLanguage,
        rating: overallRating,
        answers,
        questions,
      });
      setGeneratedText(fallbackText);
      const createdRev = mockDb.createGeneratedReview({
        review_session_id: sessionId,
        branch_id: branch.id,
        original_text: fallbackText,
        edited_text: fallbackText,
        rating: overallRating,
        language: selectedLanguage,
      });
      setReviewId(createdRev.id);
      mockDb.updateReviewSession(sessionId, overallRating, answers, true);
      mockDb.recordEvent(branch.id, 'review_generated');
    } finally {
      setIsGenerating(false);
      setStep(5);
    }
  };

  // Clipboard & Redirect handler
  const handleCopyAndRedirect = () => {
    try {
      // Copy to clipboard
      navigator.clipboard.writeText(generatedText);
      setIsCopied(true);
      mockDb.updateGeneratedReviewStatus(reviewId, 'is_copied', true);
      mockDb.recordEvent(branch.id, 'copy_review');

      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.8 },
        colors: [primaryColor, '#FFD700', '#10B981', '#F43F5E'],
      });

      // Proceed to final screen
      setStep(6);
      
      // Delay redirect by 3.5 seconds so they read the instructions
      setTimeout(() => {
        mockDb.updateGeneratedReviewStatus(reviewId, 'is_redirected', true);
        mockDb.recordEvent(branch.id, 'visit_google_review');
        window.location.href = branch.google_review_url;
      }, 3500);
    } catch (err) {
      console.error('Clipboard error:', err);
      // Fallback redirect immediately if clipboard fails
      window.location.href = branch.google_review_url;
    }
  };

  return (
    <div
      className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full bg-white shadow-xl min-h-screen relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Decorative branding shape */}
      <div 
        className="absolute top-0 left-0 right-0 h-40 opacity-10 blur-3xl pointer-events-none rounded-b-full transition-all"
        style={{ backgroundColor: primaryColor }}
      />

      {/* --- TOP NAV BRAND BAR --- */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-slate-100 relative bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {organization.logo_url || branch.logo_url ? (
            <img
              src={branch.logo_url || organization.logo_url || ''}
              alt="Logo"
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {organization.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-800 line-clamp-1">{branch.name}</h2>
            <p className="text-[10px] text-slate-400 font-medium">Powered by ReviewBee</p>
          </div>
        </div>

        {step > 2 && step < 5 && (
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full text-[10px] font-bold text-slate-500">
            <Languages className="w-3.5 h-3.5" />
            <span>{selectedLanguage.toUpperCase()}</span>
          </div>
        )}
      </header>

      {/* --- MAIN WIZARD CONTAINER --- */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8 relative">
        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME SCREEN */}
          {step === 1 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="text-center flex flex-col items-center"
            >
              {organization.logo_url || branch.logo_url ? (
                <img
                  src={branch.logo_url || organization.logo_url || ''}
                  alt={branch.name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-md mb-6 border border-slate-200 animate-pulse"
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center font-extrabold text-white text-3xl shadow-lg mb-6"
                  style={{ backgroundColor: primaryColor }}
                >
                  {organization.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              <span className="px-3 py-1 bg-amber-50 border border-amber-200/50 rounded-full text-xs font-semibold text-amber-600 flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5 fill-current" /> AI Review Draft Assistant
              </span>

              <h1 className="text-2xl font-black text-slate-800 mt-2">
                {currentUiText.welcomeTitle}
              </h1>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed max-w-xs">
                {currentUiText.welcomeSubtitle}
              </p>

              {/* Simulated Stars Display */}
              <div className="flex gap-1.5 my-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-7 h-7 text-amber-400 fill-current" />
                ))}
              </div>

              <button
                onClick={handleStartReview}
                className="w-full max-w-xs py-4 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{currentUiText.startBtn}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: LANGUAGE SELECTOR */}
          {step === 2 && (
            <motion.div
              key="language"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col"
            >
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Languages className="w-6 h-6 text-slate-400" />
                <span>{currentUiText.langSelect}</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1 mb-6">
                {currentUiText.langSubtitle}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className="w-full py-4 px-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 flex items-center justify-between text-left transition active:scale-[0.99] cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{lang.native}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{lang.label}</p>
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {lang.code.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: DYNAMIC QUESTION WIZARD */}
          {step === 3 && (
            <motion.div
              key={`q-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full justify-between"
            >
              <div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-6 flex">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / (questions.length + 1)) * 100}%`,
                      backgroundColor: primaryColor,
                    }}
                  />
                </div>

                {/* VIRTUAL Q1: STAR RATING */}
                {currentQuestionIndex === 0 ? (
                  <div className="flex flex-col animate-fade-in">
                    <h3 className="text-lg font-black text-slate-800">
                      {currentUiText.ratingTitle}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 mb-8">
                      {currentUiText.ratingSubtitle}
                    </p>

                    <div className="flex items-center justify-center gap-2.5 my-8">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleRatingSelect(s)}
                          className="hover:scale-110 active:scale-95 transition cursor-pointer"
                        >
                          <Star
                            className={`w-11 h-11 ${
                              s <= overallRating
                                ? 'text-amber-400 fill-current'
                                : 'text-slate-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="text-center mt-4">
                      <span className="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-500">
                        {overallRating === 5
                          ? '🌟 Excellent!'
                          : overallRating === 4
                          ? '👍 Very Good'
                          : overallRating === 3
                          ? '😐 Satisfactory'
                          : overallRating === 2
                          ? '🙁 Disappointed'
                          : '😡 Poor Experience'}
                      </span>
                    </div>
                  </div>
                ) : (
                  // DYNAMIC QUESTION BUILDER RENDERER
                  (() => {
                    const activeQ = questions && questions[currentQuestionIndex - 1];
                    if (!activeQ) {
                      return (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Preparing your review draft...
                        </div>
                      );
                    }
                    const qText =
                      (typeof activeQ.question_text === 'object' && activeQ.question_text !== null
                        ? (activeQ.question_text[selectedLanguage] || activeQ.question_text['en'] || Object.values(activeQ.question_text)[0])
                        : activeQ.question_text) || 'Please rate your experience';
                    const opts =
                      (activeQ.options && typeof activeQ.options === 'object'
                        ? (activeQ.options[selectedLanguage] || activeQ.options['en'] || Object.values(activeQ.options)[0])
                        : []) || [];

                    return (
                      <div className="flex flex-col animate-fade-in">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                          Question {currentQuestionIndex} of {questions.length} {activeQ.is_required && <span className="text-red-500 font-bold text-xs">* Required</span>}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-800 mt-1 leading-snug">
                          {qText}
                        </h3>

                        {/* STAR RATING QUESTION */}
                        {activeQ.question_type === 'star_rating' && (
                          <div className="flex items-center justify-center gap-2 my-8">
                            {[1, 2, 3, 4, 5].map((s) => {
                              const currentVal = answers[activeQ.id] || 5;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleAnswerSelect(activeQ.id, s)}
                                  className="cursor-pointer transition hover:scale-105"
                                >
                                  <Star
                                    className={`w-9 h-9 ${
                                      s <= currentVal ? 'text-amber-400 fill-current' : 'text-slate-200'
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* SINGLE CHOICE QUESTION */}
                        {activeQ.question_type === 'single_choice' && (
                          <div className="grid grid-cols-1 gap-2.5 mt-6">
                            {opts.map((opt) => {
                              const isSelected = answers[activeQ.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  onClick={() => handleAnswerSelect(activeQ.id, opt)}
                                  className={`w-full py-3 px-4 rounded-xl border text-left text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-slate-50 border-slate-800'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                  style={isSelected ? { borderColor: primaryColor } : {}}
                                >
                                  <span className="text-slate-800">{opt}</span>
                                  <div 
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                      isSelected ? 'border-transparent' : 'border-slate-300'
                                    }`}
                                    style={isSelected ? { backgroundColor: primaryColor } : {}}
                                  >
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* MULTIPLE CHOICE QUESTION */}
                        {activeQ.question_type === 'multiple_choice' && (
                          <div className="grid grid-cols-1 gap-2.5 mt-6">
                            {opts.map((opt) => {
                              const currentVal = answers[activeQ.id] || [];
                              const isSelected = currentVal.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  onClick={() => handleAnswerSelect(activeQ.id, opt, true)}
                                  className={`w-full py-3.5 px-4 rounded-xl border text-left text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-slate-50 border-slate-800'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                  style={isSelected ? { borderColor: primaryColor } : {}}
                                >
                                  <span className="text-slate-800">{opt}</span>
                                  <div 
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                                      isSelected ? 'border-transparent' : 'border-slate-300'
                                    }`}
                                    style={isSelected ? { backgroundColor: primaryColor } : {}}
                                  >
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* EMOJI SELECTION */}
                        {activeQ.question_type === 'emoji_selection' && (
                          <div className="grid grid-cols-2 gap-3 mt-6">
                            {opts.map((opt) => {
                              const isSelected = answers[activeQ.id] === opt;
                              // Split emoji from label
                              const emojiMatch = opt.match(/[\uD800-\uDFFF\u2600-\u27BF]/u);
                              const emoji = emojiMatch ? emojiMatch[0] : '😊';
                              const label = opt.replace(emoji, '').trim();

                              return (
                                <button
                                  key={opt}
                                  onClick={() => handleAnswerSelect(activeQ.id, opt)}
                                  className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2 transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-slate-50 border-slate-800 scale-102'
                                      : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                                  style={isSelected ? { borderColor: primaryColor } : {}}
                                >
                                  <span className="text-3xl">{emoji}</span>
                                  <span className="text-xs font-bold text-slate-700">{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* TEXT INPUT QUESTION */}
                        {activeQ.question_type === 'text_input' && (
                          <textarea
                            value={answers[activeQ.id] || ''}
                            onChange={(e) => handleAnswerSelect(activeQ.id, e.target.value)}
                            placeholder={selectedLanguage === 'en' ? "Write your comment here..." : selectedLanguage === 'ml' ? "നിങ്ങളുടെ അഭിപ്രായം ഇവിടെ എഴുതുക..." : "यहाँ लिखें..."}
                            rows={4}
                            className="w-full mt-6 p-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none"
                            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                          />
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* WIZARD ACTIONS FOOTER */}
              <div className="flex gap-3 mt-8 border-t border-slate-100 pt-6">
                <button
                  onClick={handlePrevQuestion}
                  className="flex-1 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 active:scale-[0.98] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{currentUiText.prevBtn}</span>
                </button>

                <button
                  onClick={handleNextQuestion}
                  className="flex-1 py-3.5 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 hover:shadow-md active:scale-[0.98] cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>
                    {currentQuestionIndex === questions.length
                      ? currentUiText.submitBtn
                      : currentUiText.nextBtn}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: AI GENERATING LOADER */}
          {step === 4 && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center flex flex-col items-center justify-center py-8"
            >
              <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                <div 
                  className="absolute inset-0 border-4 border-t-transparent rounded-full animate-spin" 
                  style={{ borderTopColor: primaryColor }}
                />
                <Sparkles 
                  className="w-6 h-6 animate-pulse" 
                  style={{ color: primaryColor }}
                />
              </div>

              <h2 className="text-xl font-black text-slate-800">{currentUiText.generating}</h2>
              <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
                {currentUiText.generatingSubtitle}
              </p>

              {/* Animated status tags */}
              <div className="flex gap-2 mt-6">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> Analyzing answers
                </span>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" /> Creating review text
                </span>
              </div>
            </motion.div>
          )}

          {/* STEP 5: PREVIEW & EDIT REVIEW */}
          {step === 5 && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col"
            >
              <span className="px-3 py-1 bg-green-50 border border-green-200/50 rounded-full text-[10px] font-bold text-green-600 flex items-center gap-1 self-start mb-2">
                <Sparkles className="w-3 h-3 fill-current" /> AI Generated Draft
              </span>

              <h3 className="text-lg font-black text-slate-800">
                {currentUiText.previewTitle}
              </h3>
              <p className="text-slate-400 text-xs mt-1 mb-5">
                {currentUiText.previewSubtitle}
              </p>

              <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-inner group">
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 focus:outline-none resize-none leading-relaxed"
                  rows={6}
                />
                
                {/* Micro-actions */}
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-200/50">
                  <button
                    onClick={generateReviewText}
                    className="p-2 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{currentUiText.regenerate}</span>
                  </button>
                </div>
              </div>

              {/* Paste Instructions Tip */}
              <div className="mt-5 p-4 bg-amber-50/50 border border-amber-200/30 rounded-xl flex gap-3 text-left">
                <ClipboardCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800">Important Instructions:</h4>
                  <p className="text-[11px] text-amber-700/80 leading-relaxed mt-1 whitespace-pre-line">
                    {currentUiText.pasteInstructions}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyAndRedirect}
                className="w-full py-4 text-white font-black rounded-xl shadow-lg mt-6 flex items-center justify-center gap-2 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <span>{currentUiText.copyBtn}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 6: REDIRECT / COPY SUCCESS SCREEN */}
          {step === 6 && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center flex flex-col items-center justify-center py-6"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-bounce">
                <ClipboardCheck className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-black text-slate-800">{currentUiText.copiedText}</h2>
              
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-6 text-left text-xs leading-relaxed text-slate-500">
                <span className="font-bold text-slate-700 block mb-1">What to do next:</span>
                <p>1. Google Review Box will open in a moment.</p>
                <p>2. Tap the star rating on Google (e.g. 5 Stars).</p>
                <p>3. Tap and hold in the review box, select <b>Paste</b> to paste the review draft.</p>
                <p>4. Tap <b>Post</b> on Google to submit.</p>
              </div>

              <p className="text-slate-400 text-[11px] mt-8 max-w-xs">
                {currentUiText.redirectPrompt}
              </p>

              <a
                href={branch.google_review_url}
                target="_self"
                className="mt-3 px-5 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-2"
              >
                <span>{currentUiText.redirectBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- BRAND FOOTER --- */}
      <footer className="py-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
        <span>© 2026 ReviewBee. All Rights Reserved.</span>
      </footer>
    </div>
  );
}
