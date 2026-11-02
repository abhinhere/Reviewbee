'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Star,
  Sparkles,
  LayoutDashboard,
  Building,
  Sliders,
  QrCode,
  CreditCard,
  LogOut,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Globe,
  Settings as SettingsIcon,
  Printer,
  ChevronRight,
  TrendingUp,
  Smartphone,
  Eye,
  CheckCircle,
  Menu,
  X,
  RefreshCw,
  FolderOpen,
  BrainCircuit,
  Bot,
  Zap,
  Wand2,
  Copy,
  Check,
  FileText,
  MessageSquare
} from 'lucide-react';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import { generateAIdraft } from '@/lib/ai';
import {
  mockDb,
  isSupabaseConfigured,
  supabase,
  Organization,
  Branch,
  Settings,
  ReviewQuestion,
  Subscription
} from '@/lib/db';

export default function DashboardPage() {
  const router = useRouter();

  // Clean initial state (no mock test pre-hydration)
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'analytics' | 'branches' | 'questions' | 'ai' | 'posters' | 'billing'>('analytics');

  // Filters & Analytics State
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedRange, setSelectedRange] = useState<number>(30);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Mobile menu control
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- AI Copilot Simulation States ---
  const [showAISimulator, setShowAISimulator] = useState(false);
  const [simRating, setSimRating] = useState<number>(5);
  const [simTone, setSimTone] = useState<string>('friendly');
  const [simLang, setSimLang] = useState<string>('en');
  const [simDraft, setSimDraft] = useState<string>('');
  const [isSimGenerating, setIsSimGenerating] = useState(false);
  const [simCopied, setSimCopied] = useState(false);

  // Instant AI review generation runner for sidebar widget & sandbox
  const handleRunAISimulation = async (customRating?: number, customTone?: string, customLang?: string) => {
    setIsSimGenerating(true);
    setSimCopied(false);
    const r = customRating !== undefined ? customRating : simRating;
    const t = customTone || (settings?.ai_writing_tone || 'friendly');
    const l = customLang || simLang;

    try {
      const sampleQuestions = questions.length > 0 ? questions : mockDb.getQuestions(organization?.id || 'sample');
      const sampleAnswers: Record<string, any> = {};
      sampleQuestions.forEach((q) => {
        if (q.question_type === 'emoji_selection') sampleAnswers[q.id] = 'Friendly & Attentive 😊';
        else if (q.question_type === 'star_rating') sampleAnswers[q.id] = r;
        else if (q.question_type === 'single_choice' && q.options && (q.options as any)[l]) {
          sampleAnswers[q.id] = (q.options as any)[l][0] || 'Yes, definitely';
        } else if (q.question_type === 'multiple_choice' && q.options && (q.options as any)[l]) {
          sampleAnswers[q.id] = [(q.options as any)[l][0] || 'Clean environment', (q.options as any)[l][1] || 'Great service'];
        }
      });

      const draft = await generateAIdraft({
        tone: t as any,
        length: (settings?.ai_review_length as any) || 'medium',
        language: l,
        rating: r,
        answers: sampleAnswers,
        questions: sampleQuestions,
      });

      setSimDraft(draft);
    } catch (e) {
      console.error('AI Simulation error:', e);
      setSimDraft("Exceptional experience! The staff was attentive and courteous, and the facilities were top quality. Will definitely visit again!");
    } finally {
      setIsSimGenerating(false);
    }
  };

  // --- Form & Editing States ---
  // Branch Form
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchSlug, setNewBranchSlug] = useState('');
  const [newBranchPlaceId, setNewBranchPlaceId] = useState('');
  const [newBranchReviewUrl, setNewBranchReviewUrl] = useState('');
  const [newBranchColor, setNewBranchColor] = useState('#3b82f6');

  // Question Builder Edit State
  const [selectedCategory, setSelectedCategory] = useState<string>('restaurant');
  const [newQuestionType, setNewQuestionType] = useState<ReviewQuestion['question_type']>('star_rating');
  const [newQuestionText, setNewQuestionText] = useState({ en: '', ml: '', hi: '', ar: '' });
  const [newQuestionOptionsRaw, setNewQuestionOptionsRaw] = useState({ en: '', ml: '', hi: '', ar: '' });
  const [newQuestionRequired, setNewQuestionRequired] = useState(false);

  // Poster Config State
  const [posterLayout, setPosterLayout] = useState<'stand' | 'poster' | 'counter' | 'wall'>('stand');
  const [posterSize, setPosterSize] = useState<'A4' | 'A5'>('A5');
  const [posterCtaText, setPosterCtaText] = useState('Loved your experience?');
  const [posterSubCtaText, setPosterSubCtaText] = useState('Scan here and share your review.');
  const [posterColor, setPosterColor] = useState('#3b82f6');
  const [posterTextColor, setPosterTextColor] = useState('#ffffff');

  // Load Admin Workspace
  const loadWorkspace = async () => {
    try {
      if (!currentUser) {
        setLoading(true);
      }

      // Handle direct OAuth code exchange if redirected directly to /dashboard
      if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error') || urlParams.get('error_description');

        if (error) {
          console.error('OAuth callback error:', error);
          router.replace(`/login?error=${encodeURIComponent(error)}`);
          return;
        }

        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(code);
            if (window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          } catch (codeErr) {
            console.warn('Code exchange warning:', codeErr);
          }
        }
      }

      // Fast check for authenticated user
      let supabaseUser: any = null;
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            supabaseUser = session.user;
          }
        } catch (authErr) {
          console.warn('Supabase session retrieval warning:', authErr);
        }
      }

      // In real mode, require active authentication
      if (isSupabaseConfigured && !supabaseUser) {
        router.replace('/login');
        return;
      }

      let user: any = null;

      if (supabaseUser) {
        let profile: any = null;
        try {
          const { data: prof, error: profErr } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .maybeSingle();
          if (!profErr && prof) {
            profile = prof;
          }
        } catch (pErr) {
          console.warn('Profile fetch warning:', pErr);
        }

        let orgId = profile?.organization_id;

        // Auto-provision if profile is missing in Supabase
        if (!profile || !orgId) {
          const orgName =
            supabaseUser.user_metadata?.organization_name ||
            (supabaseUser.user_metadata?.full_name ? `${supabaseUser.user_metadata.full_name}'s Business` : 'My Business');
          const orgSlug =
            (supabaseUser.email?.split('@')[0] || 'business').toLowerCase().replace(/[^a-z0-9]/g, '-') +
            '-' +
            Math.random().toString(36).substring(2, 6);

          try {
            const { data: newOrg } = await supabase!
              .from('organizations')
              .insert({ name: orgName, slug: orgSlug })
              .select()
              .maybeSingle();

            if (newOrg) {
              orgId = newOrg.id;

              const { data: newProf } = await supabase!
                .from('profiles')
                .insert({
                  id: supabaseUser.id,
                  organization_id: newOrg.id,
                  role: 'owner',
                  full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Business Owner',
                })
                .select()
                .maybeSingle();

              if (newProf) profile = newProf;

              // Fire off defaults in background
              Promise.all([
                supabase!.from('settings').insert({
                  organization_id: newOrg.id,
                  enabled_languages: ['en', 'ml', 'hi', 'ar'],
                }),
                supabase!.from('subscriptions').insert({
                  organization_id: newOrg.id,
                  plan_name: 'enterprise',
                  status: 'active',
                }),
                supabase!.from('branches').insert({
                  organization_id: newOrg.id,
                  name: 'Main Location',
                  slug: 'main',
                  google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83tdY4',
                  google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83tdY4',
                }),
              ]).catch(() => {});
            }
          } catch (provisionErr) {
            console.warn('Auto-provisioning handled by fallbacks:', provisionErr);
          }
        }

        if (!orgId) {
          orgId = 'org-' + supabaseUser.id.substring(0, 8);
        }
        user = {
          id: profile?.id || supabaseUser.id,
          email: supabaseUser.email || '',
          full_name: profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Business Owner',
          organization_id: orgId,
        };
      } else {
        user = mockDb.getCurrentUser();
      }

      if (!user) {
        router.replace('/login');
        return;
      }
      setCurrentUser(user);

      let orgData: Organization | null = null;
      let branchData: Branch[] = [];
      let settingsData: Settings | null = null;
      let questionsData: ReviewQuestion[] = [];
      let subData: Subscription | null = null;

      if (isSupabaseConfigured && supabase && supabaseUser) {
        try {
          const [orgRes, branchesRes, settingsRes, questionsRes, subRes] = await Promise.all([
            supabase.from('organizations').select('*').eq('id', user.organization_id).maybeSingle(),
            supabase.from('branches').select('*').eq('organization_id', user.organization_id),
            supabase.from('settings').select('*').eq('organization_id', user.organization_id).maybeSingle(),
            supabase.from('review_questions').select('*').eq('organization_id', user.organization_id).order('sort_order', { ascending: true }),
            supabase.from('subscriptions').select('*').eq('organization_id', user.organization_id).maybeSingle(),
          ]);

          if (orgRes.data) orgData = orgRes.data;
          if (branchesRes.data) branchData = branchesRes.data;
          if (settingsRes.data) settingsData = settingsRes.data;
          if (questionsRes.data) questionsData = questionsRes.data;
          if (subRes.data) subData = subRes.data;
        } catch (e) {
          console.warn('Error fetching Supabase workspace:', e);
        }
      } else {
        orgData = mockDb.getOrganization(user.organization_id) || null;
        branchData = mockDb.getBranches(user.organization_id);
        settingsData = mockDb.getSettings(user.organization_id);
        questionsData = mockDb.getQuestions(user.organization_id);
        subData = mockDb.getSubscription(user.organization_id);
      }

      // Safe Fallbacks so workspace NEVER fails or gets stuck
      if (!orgData) {
        orgData = mockDb.getOrganization(user.organization_id) || {
          id: user.organization_id,
          name: user.full_name ? `${user.full_name}'s Business` : 'My Business',
          slug: (user.email?.split('@')[0] || 'business').toLowerCase().replace(/[^a-z0-9]/g, '-'),
          logo_url: null,
          primary_color: '#3B82F6',
          created_at: new Date().toISOString(),
        };
      }

      if (!branchData || branchData.length === 0) {
        const mockBranches = mockDb.getBranches(user.organization_id);
        branchData = mockBranches.length > 0 ? mockBranches : [
          {
            id: 'branch-' + user.organization_id,
            organization_id: user.organization_id,
            name: 'Main Location',
            slug: 'main',
            google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83tdY4',
            google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83tdY4',
            primary_color: '#3B82F6',
            logo_url: null,
            created_at: new Date().toISOString(),
          },
        ];
      }

      if (!settingsData) {
        settingsData = mockDb.getSettings(user.organization_id) || {
          id: 'settings-' + user.organization_id,
          organization_id: user.organization_id,
          ai_writing_tone: 'friendly',
          ai_review_length: 'medium',
          enabled_languages: ['en', 'ml', 'hi', 'ar'],
        };
      }

      if (!questionsData || questionsData.length === 0) {
        questionsData = mockDb.getQuestions(user.organization_id);
      }

      if (!subData) {
        subData = mockDb.getSubscription(user.organization_id) || {
          id: 'sub-' + user.organization_id,
          organization_id: user.organization_id,
          plan_name: 'enterprise',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      setOrganization(orgData);
      setBranches(branchData);
      setSettings(settingsData);
      setQuestions(questionsData);
      setSubscription(subData);

      // Generate analytics report
      if (orgData) {
        const report = mockDb.getAnalyticsReport(selectedBranchId, orgData.id, selectedRange);
        setAnalyticsData(report);
      }
    } catch (err) {
      console.error('Error loading dashboard workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadWorkspace();

    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          loadWorkspace();
        } else if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
      });
      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, [router]);

  // Reload analytics when filter selectors change
  useEffect(() => {
    if (organization) {
      const report = mockDb.getAnalyticsReport(selectedBranchId, organization.id, selectedRange);
      setAnalyticsData(report);
    }
  }, [selectedBranchId, selectedRange, organization]);

  // Auto slug generator for branches
  useEffect(() => {
    setNewBranchSlug(newBranchName.toLowerCase().replace(/[^a-z0-9]/g, '-') || '');
  }, [newBranchName]);

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    mockDb.logout();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('reviewbee_db_store');
    }
    router.replace('/login');
  };

  if (!mounted || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen text-slate-600">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <Star className="w-4 h-4 text-blue-600 absolute fill-blue-600" />
        </div>
        <p className="text-xs font-medium text-slate-500">Loading ReviewBee workspace...</p>
      </div>
    );
  }

  if (!organization || !settings || !subscription) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800">Workspace Unavailable</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-xs">There was a problem restoring your organization settings.</p>
        <button onClick={loadWorkspace} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
      </div>
    );
  }

  // --- Branch Creation Handler ---
  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Full Access Unlocked: Unlimited branches allowed for all users

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('branches').insert({
        organization_id: organization.id,
        name: newBranchName,
        slug: newBranchSlug,
        google_place_id: newBranchPlaceId || null,
        google_review_url: newBranchReviewUrl,
        primary_color: newBranchColor,
      });
      if (error) {
        alert(error.message);
        return;
      }
    } else {
      mockDb.createBranch(organization.id, {
        name: newBranchName,
        slug: newBranchSlug,
        google_place_id: newBranchPlaceId || null,
        google_review_url: newBranchReviewUrl,
        primary_color: newBranchColor,
        logo_url: null,
      });
    }

    // Refresh state
    setNewBranchName('');
    setNewBranchPlaceId('');
    setNewBranchReviewUrl('');
    setShowAddBranch(false);
    loadWorkspace();
  };

  const handleBranchDelete = async (branchId: string) => {
    if (branches.length <= 1) {
      alert("At least one active branch is required for ReviewBee review links to function.");
      return;
    }
    if (!confirm("Are you sure you want to delete this branch? All reviews and analytics will be permanently lost.")) return;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('branches').delete().eq('id', branchId);
    } else {
      mockDb.deleteBranch(branchId);
    }
    loadWorkspace();
  };

  // --- AI Settings updates ---
  const handleUpdateAISettings = async (tone: Settings['ai_writing_tone'], length: Settings['ai_review_length']) => {
    const updated = { ...settings, ai_writing_tone: tone, ai_review_length: length };
    setSettings(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('settings').update({ ai_writing_tone: tone, ai_review_length: length }).eq('organization_id', organization.id);
    } else {
      mockDb.updateSettings(organization.id, { ai_writing_tone: tone, ai_review_length: length });
    }
  };

  const handleToggleLang = async (langCode: string) => {
    let list = [...settings.enabled_languages];
    if (list.includes(langCode)) {
      if (list.length <= 1) {
        alert("At least one review language must remain enabled.");
        return;
      }
      list = list.filter((l) => l !== langCode);
    } else {
      list.push(langCode);
    }

    const updated = { ...settings, enabled_languages: list };
    setSettings(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('settings').update({ enabled_languages: list }).eq('organization_id', organization.id);
    } else {
      mockDb.updateSettings(organization.id, { enabled_languages: list });
    }
  };

  // --- Question Builder Templates Loader ---
  const loadPresetQuestions = (categoryName: string) => {
    if (!confirm(`This will replace your current questionnaire with default questions for a '${categoryName.toUpperCase()}'. Proceed?`)) return;

    let defaultQs: ReviewQuestion[] = [];
    const setUuid = 'qset-custom-uuid';

    // Renders custom structured sets
    if (categoryName === 'restaurant') {
      defaultQs = [
        {
          id: 'q-res-1',
          question_set_id: setUuid,
          organization_id: organization.id,
          question_text: {
            en: 'How was the food taste and quality today?',
            ml: 'ഇന്നത്തെ ഭക്ഷണത്തിന്റെ രുചിയും ഗുണനിലവാരവും എങ്ങനെയുണ്ടായിരുന്നു?',
            hi: 'आज भोजन का स्वाद और गुणवत्ता कैसी थी?',
            ar: 'كيف كان طعم وجودة الطعام اليوم؟',
          },
          question_type: 'star_rating',
          options: null,
          is_required: true,
          sort_order: 1,
          is_enabled: true,
        },
        {
          id: 'q-res-2',
          question_set_id: setUuid,
          organization_id: organization.id,
          question_text: {
            en: 'What did you order from our menu?',
            ml: 'ഞങ്ങളുടെ മെനുവിൽ നിന്ന് നിങ്ങൾ എന്താണ് ഓർഡർ ചെയ്തത്?',
            hi: 'आपने हमारे मेनू से क्या ऑर्डर किया?',
            ar: 'ماذا طلبتم من قائمتنا؟',
          },
          question_type: 'multiple_choice',
          options: {
            en: ['Appetizers', 'Main Course', 'Desserts / Sweets', 'Beverages / Drinks'],
            ml: ['അപ്പെറ്റൈസർ', 'പ്രധാന വിഭവങ്ങൾ', 'ഡെസേർട്ടുകൾ', 'പാനീയങ്ങൾ'],
            hi: ['स्टार्टर', 'मुख्य भोजन', 'मिठाइयाँ', 'पेय पदार्थ'],
            ar: ['المقبلات', 'الطبق الرئيسي', 'الحلويات', 'المشروبات'],
          },
          is_required: false,
          sort_order: 2,
          is_enabled: true,
        },
        {
          id: 'q-res-3',
          question_set_id: setUuid,
          organization_id: organization.id,
          question_text: {
            en: 'How would you rate the customer service and hospitality?',
            ml: 'ഞങ്ങളുടെ കസ്റ്റമർ സർവീസും ഹോസ്പിറ്റാലിറ്റിയും എങ്ങനെയുണ്ടായിരുന്നു?',
            hi: 'हमारी ग्राहक सेवा और आतिथ्य सत्कार कैसा रहा?',
            ar: 'كيف تقيم خدمة العملاء والضيافة؟',
          },
          question_type: 'emoji_selection',
          options: {
            en: ['Friendly & Attentive 😊', 'Professional & Swift 👍', 'Average 😐', 'Needs Improvement 🙁'],
            ml: ['സൗഹൃദപരം 😊', 'പ്രൊഫഷണൽ 👍', 'ശരാശരി 😐', 'മെച്ചപ്പെടാനുണ്ട് 🙁'],
            hi: ['मिलनसार 😊', 'पेशेवर 👍', 'सामान्य 😐', 'सुधार की आवश्यकता 🙁'],
            ar: ['ودود ومتعاون 😊', 'محترف وسريع 👍', 'متوسط 😐', 'بحاجة إلى تحسين 🙁'],
          },
          is_required: true,
          sort_order: 3,
          is_enabled: true,
        },
      ];
    } else if (categoryName === 'salon') {
      defaultQs = [
        {
          id: 'q-sal-1',
          question_set_id: setUuid,
          organization_id: organization.id,
          question_text: {
            en: 'Rate your haircut / styling experience',
            ml: 'ഹെയർകട്ട് / സ്റ്റൈലിംഗ് അനുഭവം വിലയിരുത്തുക',
            hi: 'अपने हेयरकट / स्टाइलिंग अनुभव को रेट करें',
            ar: 'قيم تجربتك في قص / تصفيف الشعر',
          },
          question_type: 'star_rating',
          options: null,
          is_required: true,
          sort_order: 1,
          is_enabled: true,
        },
        {
          id: 'q-sal-2',
          question_set_id: setUuid,
          organization_id: organization.id,
          question_text: {
            en: 'How was the cleanliness & ambiance of our salon?',
            ml: 'ഞങ്ങളുടെ സലൂണിന്റെ വൃത്തിയും അന്തരീക്ഷവും എങ്ങനെയുണ്ടായിരുന്നു?',
            hi: 'सैलून की स्वच्छता और माहौल कैसा था?',
            ar: 'كيف كانت نظافة وأجواء الصالون؟',
          },
          question_type: 'emoji_selection',
          options: {
            en: ['Sparkling Clean ✨', 'Nice & Cozy 💅', 'Average 😐', 'Needs Improvement 🙁'],
            ml: ['വളരെ വൃത്തിയുള്ളത് ✨', 'നല്ല അന്തരീക്ഷം 💅', 'ശരാശരി 😐', 'മെച്ചപ്പെടാനുണ്ട് 🙁'],
            hi: ['अति स्वच्छ ✨', 'अच्छा और आरामदायक 💅', 'सामान्य 😐', 'सुधार की आवश्यकता 🙁'],
            ar: ['نظيف ولامع ✨', 'جميل ومريح 💅', 'متوسط 😐', 'بحاجة لتحسين 🙁'],
          },
          is_required: true,
          sort_order: 2,
          is_enabled: true,
        },
      ];
    } else if (categoryName === 'clinic') {
      defaultQs = [
        {
          id: 'q-cl-1',
          question_set_id: setUuid,
          organization_id: organization.id,
          question_text: {
            en: 'Rate the bedside manner of our doctors & medical staff',
            ml: 'ഡോക്ടർമാരുടെയും മെഡിക്കൽ ജീവനക്കാരുടെയും പെരുമാറ്റം വിലയിരുത്തുക',
            hi: 'डॉक्टरों और मेडिकल स्टाफ के व्यवहार को रेट करें',
            ar: 'قيم تعامل الأطباء والطاقم الطبي',
          },
          question_type: 'star_rating',
          options: null,
          is_required: true,
          sort_order: 1,
          is_enabled: true,
        },
        {
          id: 'q-cl-2',
          question_set_id: setUuid,
          organization_id: organization.id,
          question_text: {
            en: 'How was the waiting time before consultation?',
            ml: 'കൺസൾട്ടേഷന് മുൻപുള്ള കാത്തിരിപ്പ് സമയം എങ്ങനെയുണ്ടായിരുന്നു?',
            hi: 'परामर्श से पहले प्रतीक्षा समय कैसा था?',
            ar: 'كيف كانت مدة الانتظار قبل الدخول للطبيب؟',
          },
          question_type: 'single_choice',
          options: {
            en: ['Very Fast Consultation', 'Reasonable / Acceptable', 'A bit slow'],
            ml: ['വളരെ വേഗത്തിൽ', 'തൃപ്തികരമായ കാത്തിരിപ്പ്', 'കുറച്ചു താമസം'],
            hi: ['बहुत तेज़ परामर्श', 'उचित / स्वीकार्य', 'थोड़ा धीमा'],
            ar: ['سريع جداً', 'مقبول ومعقول', 'بطيء نوعاً ما'],
          },
          is_required: false,
          sort_order: 2,
          is_enabled: true,
        },
      ];
    } else {
      // General Custom
      defaultQs = [
        {
          id: 'q-cus-1',
          question_set_id: setUuid,
          organization_id: organization.id,
          question_text: {
            en: 'Rate your overall experience with our service',
            ml: 'ഞങ്ങളുടെ സേവനങ്ങളെക്കുറിച്ചുള്ള നിങ്ങളുടെ ആകെ അനുഭവം വിലയിരുത്തുക',
            hi: 'हमारी सेवा के साथ अपने समग्र अनुभव को रेट करें',
            ar: 'قيم تجربتك العامة مع خدمتنا',
          },
          question_type: 'star_rating',
          options: null,
          is_required: true,
          sort_order: 1,
          is_enabled: true,
        },
      ];
    }

    setQuestions(defaultQs);
    mockDb.saveQuestions(organization.id, defaultQs);
  };

  const handleAddQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.en) {
      alert("English question text is required.");
      return;
    }

    const setUuid = 'qset-custom-uuid';
    const newId = `q-${Math.random().toString(36).substr(2, 9)}`;

    // Parse options
    let parsedOptions: Record<string, string[]> | null = null;
    if (['single_choice', 'multiple_choice', 'emoji_selection'].includes(newQuestionType)) {
      parsedOptions = {
        en: newQuestionOptionsRaw.en.split(',').map((x) => x.trim()).filter(Boolean),
        ml: newQuestionOptionsRaw.ml.split(',').map((x) => x.trim()).filter(Boolean),
        hi: newQuestionOptionsRaw.hi.split(',').map((x) => x.trim()).filter(Boolean),
        ar: newQuestionOptionsRaw.ar.split(',').map((x) => x.trim()).filter(Boolean),
      };
    }

    const newQ: ReviewQuestion = {
      id: newId,
      question_set_id: setUuid,
      organization_id: organization.id,
      question_text: newQuestionText,
      question_type: newQuestionType,
      options: parsedOptions,
      is_required: newQuestionRequired,
      sort_order: questions.length + 1,
      is_enabled: true,
    };

    const updatedQs = [...questions, newQ];
    setQuestions(updatedQs);
    mockDb.saveQuestions(organization.id, updatedQs);

    // Reset forms
    setNewQuestionText({ en: '', ml: '', hi: '', ar: '' });
    setNewQuestionOptionsRaw({ en: '', ml: '', hi: '', ar: '' });
    setNewQuestionRequired(false);
  };

  const handleQuestionDelete = (qId: string) => {
    const updated = questions.filter((q) => q.id !== qId);
    setQuestions(updated);
    mockDb.saveQuestions(organization.id, updated);
  };

  const handleQuestionReorder = (index: number, direction: 'up' | 'down') => {
    const list = [...questions];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    // Update sort orders
    const updated = list.map((q, idx) => ({ ...q, sort_order: idx + 1 }));
    setQuestions(updated);
    mockDb.saveQuestions(organization.id, updated);
  };

  // --- Subscriptions changes ---
  const handleUpgradePlan = (plan: Subscription['plan_name']) => {
    mockDb.updateSubscription(organization.id, plan);
    loadWorkspace();
    alert(`Success: Switched organization subscription plan to '${plan.toUpperCase()}'! Feature limits updated.`);
  };

  return (
    <div className="flex-1 flex bg-slate-50 min-h-screen print:bg-white print:min-h-0">
      
      {/* --- STANDARD LIGHT SIDEBAR NAV --- */}
      <aside className={`w-64 bg-white text-slate-600 flex flex-col justify-between fixed md:sticky top-0 h-screen z-50 transition-all duration-200 border-r border-slate-200 ${
        isMobileMenuOpen ? 'left-0' : '-left-64 md:left-0'
      } print:hidden select-none shadow-sm`}>
        
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Star className="w-4 h-4 fill-current text-blue-600" />
              </div>
              <span className="font-bold text-slate-900 text-base tracking-tight">ReviewBee</span>
            </div>
            {/* Close button for mobile menu */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace row */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
            <span className="font-semibold text-slate-800 truncate text-xs">{organization?.name || 'My Business'}</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live
            </span>
          </div>

          {/* Clean Navigation */}
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            {[
              { id: 'analytics', label: 'Overview', icon: LayoutDashboard },
              { id: 'branches', label: 'Branches', icon: Building },
              { id: 'questions', label: 'Survey Questions', icon: Sliders },
              { id: 'ai', label: 'Review Settings', icon: FileText },
              { id: 'posters', label: 'QR Posters', icon: QrCode },
              { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Review Draft Preview trigger */}
          <div className="p-3 shrink-0">
            <button
              type="button"
              id="btn-preview-review"
              onClick={() => {
                setShowAISimulator(true);
                if (!simDraft) handleRunAISimulation();
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-between transition cursor-pointer text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold">Review Draft Preview</span>
              </div>
              <span className="text-[10px] text-slate-400 capitalize">{settings?.ai_writing_tone || 'Friendly'}</span>
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="h-14 px-4 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs bg-slate-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-200">
              {currentUser?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="truncate min-w-0">
              <p className="font-semibold text-slate-800 text-xs truncate leading-tight">{currentUser?.full_name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate leading-tight">Business Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* --- MAIN PAGE WORKSPACE --- */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden print:min-h-0 print:overflow-x-visible">
        
        {/* MOBILE TOP BAR NAVIGATION */}
        <header className="md:hidden bg-white text-slate-800 h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0 sticky top-0 z-40 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Star className="w-4 h-4 fill-current text-blue-600" />
            </div>
            <span className="font-bold text-sm text-slate-900">ReviewBee</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-slate-600 hover:text-slate-900 p-1.5"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* CONTENT CONTENT CONTAINER */}
        <div className="flex-1 p-6 md:p-10 max-w-5xl w-full mx-auto print:p-0">
          
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'analytics' && analyticsData && (
            <div className="space-y-8 animate-fade-in print:hidden">
              
              {/* Heading Filter Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Analytics Dashboard</h1>
                  <p className="text-slate-400 text-xs mt-0.5">Real-time statistics of QR scans and reviews generated.</p>
                </div>
                
                {/* Selectors */}
                <div className="flex gap-2">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedRange}
                    onChange={(e) => setSelectedRange(Number(e.target.value))}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                </div>
              </div>

              {/* Stats cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'QR Scans', value: analyticsData.cards.scans, change: '+12%', desc: 'QR poster scans count', icon: QrCode, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Reviews Drafted', value: analyticsData.cards.reviewsGenerated, change: '+8%', desc: 'Customer review drafts', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Visits Google', value: analyticsData.cards.googleVisits, change: '+15%', desc: 'Google URL click visits', icon: CheckCircle, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Conversion Rate', value: `${analyticsData.cards.conversionRate}%`, change: '+3%', desc: 'Scans to Google redirects', icon: TrendingUp, color: 'text-rose-600 bg-rose-50' },
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-2 tracking-tight">{card.value}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{card.desc}</p>
                      </div>
                      <div className={`p-2.5 rounded-xl ${card.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extra micro metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Star className="w-6 h-6 fill-current text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Stars Selected</p>
                    <h4 className="text-lg font-black text-slate-800 mt-0.5">{analyticsData.cards.averageRatingSelected} / 5.0</h4>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Survey Completion Rate</p>
                    <h4 className="text-lg font-black text-slate-800 mt-0.5">{analyticsData.cards.completionRate}%</h4>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Most Active Day</p>
                    <h4 className="text-lg font-black text-slate-800 mt-0.5">{analyticsData.cards.mostActiveDay}</h4>
                  </div>
                </div>
              </div>

              <AnalyticsCharts analyticsData={analyticsData} />

            </div>
          )}

          {/* TAB 2: BRANCHES */}
          {activeTab === 'branches' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Branches Management</h1>
                  <p className="text-slate-400 text-xs mt-0.5">Configure individual center names, colors, place codes, and links.</p>
                </div>
                <button
                  onClick={() => setShowAddBranch(!showAddBranch)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Branch
                </button>
              </div>

              {/* Add Branch Expandable form */}
              {showAddBranch && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-slide-up">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Register New Branch</h3>
                  <form onSubmit={handleAddBranchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Branch Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. South Arena"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Branch URL Slug (autogen)</label>
                      <input
                        type="text"
                        required
                        disabled
                        value={newBranchSlug}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 text-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Google Place ID</label>
                        <a
                          href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                        >
                          Find Place ID ↗
                        </a>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83tdY4"
                        value={newBranchPlaceId}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setNewBranchPlaceId(val);
                          if (val.startsWith('ChIJ') && (!newBranchReviewUrl || newBranchReviewUrl.includes('writereview?placeid='))) {
                            setNewBranchReviewUrl(`https://search.google.com/local/writereview?placeid=${val}`);
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Google location identifier starting with <span className="font-mono font-semibold">ChIJ...</span></p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Google Review URL</label>
                      <input
                        type="url"
                        required
                        placeholder="https://search.google.com/local/writereview?placeid=..."
                        value={newBranchReviewUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewBranchReviewUrl(val);
                          const match = val.match(/placeid=([a-zA-Z0-9_-]+)/i);
                          if (match && match[1]) {
                            setNewBranchPlaceId(match[1]);
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Auto-generated from Place ID or paste your direct Google Maps review link</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Theme Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newBranchColor}
                          onChange={(e) => setNewBranchColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                        />
                        <span className="text-xs font-bold text-slate-500 uppercase">{newBranchColor}</span>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddBranch(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Save Branch
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Branch listing cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((b) => {
                  const reviewFlowUrl = typeof window !== 'undefined'
                    ? `${window.location.origin}/r/${organization.slug}/${b.slug}`
                    : `/r/${organization.slug}/${b.slug}`;

                  return (
                    <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-slate-800 text-base">{b.name}</h3>
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: b.primary_color || '#3b82f6' }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Slug: {b.slug}</p>

                        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Place ID:</span>
                            <span className="font-bold text-slate-700 truncate max-w-[150px]">{b.google_place_id || 'Not configured'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Review URL:</span>
                            <a 
                              href={b.google_review_url} 
                              target="_blank" 
                              className="font-bold text-blue-500 hover:underline truncate max-w-[150px]"
                            >
                              Open Link
                            </a>
                          </div>
                        </div>

                        {/* Customer Direct Link */}
                        <div className="mt-4">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer QR Scan Link</label>
                          <input
                            type="text"
                            readOnly
                            value={reviewFlowUrl}
                            onClick={(e) => {
                              (e.target as HTMLInputElement).select();
                              navigator.clipboard.writeText(reviewFlowUrl);
                              alert('Link copied to clipboard!');
                            }}
                            className="w-full px-2 py-1.5 bg-blue-50/50 text-[10px] font-mono text-blue-600 rounded-lg border border-blue-100 focus:outline-none cursor-pointer text-center"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5">
                        <button
                          onClick={() => {
                            setActiveTab('posters');
                            setPosterColor(b.primary_color || '#3b82f6');
                            setPosterCtaText(`Loved your experience at ${b.name}?`);
                          }}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Poster
                        </button>
                        
                        <button
                          onClick={() => handleBranchDelete(b.id)}
                          className="px-3 py-1.5 border border-red-100 hover:bg-red-50 text-red-500 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: QUESTION BUILDER */}
          {activeTab === 'questions' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Question Survey Builder</h1>
                  <p className="text-slate-400 text-xs mt-0.5">Customize questionnaire fields, re-order them, or load templates.</p>
                </div>
                
                {/* Select Preset Templates dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="restaurant">Restaurant Template</option>
                    <option value="salon">Salon Template</option>
                    <option value="clinic">Clinic Template</option>
                    <option value="gym">Gym / Center Template</option>
                    <option value="custom">General Custom</option>
                  </select>
                  <button
                    onClick={() => loadPresetQuestions(selectedCategory)}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Load preset
                  </button>
                </div>
              </div>

              {/* Questionnaire Form Add Question */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Add Custom Question</h3>
                <form onSubmit={handleAddQuestionSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Question Type</label>
                      <select
                        value={newQuestionType}
                        onChange={(e) => setNewQuestionType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-sm cursor-pointer"
                      >
                        <option value="star_rating">Star Rating</option>
                        <option value="single_choice">Single Choice Select</option>
                        <option value="multiple_choice">Multiple Choice (Checkboxes)</option>
                        <option value="emoji_selection">Emoji Selection grid</option>
                        <option value="text_input">Text Area comment</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newQuestionRequired}
                          onChange={(e) => setNewQuestionRequired(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Is this question required?</span>
                      </label>
                    </div>
                  </div>

                  {/* Multi-lingual Question texts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5">English Text</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. How was our customer service?"
                        value={newQuestionText.en}
                        onChange={(e) => setNewQuestionText((prev) => ({ ...prev, en: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Malayalam Translation (Optional)</label>
                      <input
                        type="text"
                        placeholder="ഞങ്ങളുടെ കസ്റ്റമർ സർവീസ് എങ്ങനെയുണ്ടായിരുന്നു?"
                        value={newQuestionText.ml}
                        onChange={(e) => setNewQuestionText((prev) => ({ ...prev, ml: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Hindi Translation (Optional)</label>
                      <input
                        type="text"
                        placeholder="हमारी ग्राहक सेवा कैसी थी?"
                        value={newQuestionText.hi}
                        onChange={(e) => setNewQuestionText((prev) => ({ ...prev, hi: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Arabic Translation (Optional)</label>
                      <input
                        type="text"
                        placeholder="كيف كانت خدمة العملاء لدينا؟"
                        value={newQuestionText.ar}
                        onChange={(e) => setNewQuestionText((prev) => ({ ...prev, ar: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* Multi Choice Options options */}
                  {['single_choice', 'multiple_choice', 'emoji_selection'].includes(newQuestionType) && (
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configure Option Choices (comma separated list)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-blue-600 block">English choices</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Excellent, Good, Average, Poor"
                            value={newQuestionOptionsRaw.en}
                            onChange={(e) => setNewQuestionOptionsRaw((prev) => ({ ...prev, en: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">Malayalam choices</label>
                          <input
                            type="text"
                            placeholder="മികച്ചത്, കൊള്ളാം, ശരാശരി, മോശം"
                            value={newQuestionOptionsRaw.ml}
                            onChange={(e) => setNewQuestionOptionsRaw((prev) => ({ ...prev, ml: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">Hindi choices</label>
                          <input
                            type="text"
                            placeholder="उत्कृष्ट, अच्छा, सामान्य, खराब"
                            value={newQuestionOptionsRaw.hi}
                            onChange={(e) => setNewQuestionOptionsRaw((prev) => ({ ...prev, hi: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">Arabic choices</label>
                          <input
                            type="text"
                            placeholder="ممتاز, جيد, متوسط, سيء"
                            value={newQuestionOptionsRaw.ar}
                            onChange={(e) => setNewQuestionOptionsRaw((prev) => ({ ...prev, ar: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-700 transition"
                    >
                      Add to Question List
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Questions Lists */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Active Questionnaire List</h3>
                {questions.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-medium">
                    No active questions found. Click a preset template above to initialize automatically.
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-snug">{q.question_text.en}</h4>
                          <div className="flex gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                              Type: {q.question_type.replace('_', ' ')}
                            </span>
                            {q.is_required && (
                              <span className="px-2 py-0.5 rounded bg-red-50 text-red-500 font-bold text-[9px] uppercase tracking-wider">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Control arrows and delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleQuestionReorder(idx, 'up')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={idx === questions.length - 1}
                          onClick={() => handleQuestionReorder(idx, 'down')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuestionDelete(q.id)}
                          className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 4: AI SETTINGS */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Settings & Languages</h1>
                <p className="text-slate-500 text-xs mt-0.5">Customize default review writing style, draft length, and customer languages.</p>
              </div>

              {/* Tone settings card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Review Writing Style</h3>
                  <p className="text-slate-400 text-xs">Set the default vocabulary style for generated reviews.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {[
                      { tone: 'friendly', desc: 'Warm & welcoming' },
                      { tone: 'professional', desc: 'Direct & factual' },
                      { tone: 'luxury', desc: 'Elegant & premium' },
                      { tone: 'simple', desc: 'Short & direct' },
                    ].map((t) => {
                      const isSelected = settings.ai_writing_tone === t.tone;
                      return (
                        <button
                          key={t.tone}
                          type="button"
                          onClick={() => handleUpdateAISettings(t.tone as any, settings.ai_review_length)}
                          className={`p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className={`text-sm font-bold capitalize ${isSelected ? 'text-blue-600' : 'text-slate-700'}`}>
                            {t.tone}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{t.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Length settings card */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Draft Review Length</h3>
                  <p className="text-slate-400 text-xs">Configure estimated length requirements for drafts.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    {[
                      { len: 'short', desc: '1-2 sentences (~25 words)' },
                      { len: 'medium', desc: '3-4 sentences (~60 words)' },
                      { len: 'long', desc: '5+ sentences (~120 words)' },
                    ].map((l) => {
                      const isSelected = settings.ai_review_length === l.len;
                      return (
                        <button
                          key={l.len}
                          type="button"
                          onClick={() => handleUpdateAISettings(settings.ai_writing_tone, l.len as any)}
                          className={`p-4 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className={`text-sm font-bold capitalize ${isSelected ? 'text-blue-600' : 'text-slate-700'}`}>
                            {l.len}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{l.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Localized languages toggle flags */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Enabled Languages</h3>
                  <p className="text-slate-400 text-xs">Select languages customers can choose from during the review flow.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {[
                      { code: 'en', label: 'English', native: 'English' },
                      { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
                      { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
                      { code: 'ar', label: 'Arabic', native: 'العربية' },
                    ].map((lang) => {
                      const isEnabled = settings.enabled_languages.includes(lang.code);
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleToggleLang(lang.code)}
                          className={`p-4 rounded-xl border transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isEnabled
                              ? 'border-blue-600 bg-blue-50/20 text-blue-600'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <Globe className="w-5 h-5 shrink-0" />
                          <span className="text-xs font-bold mt-1">{lang.native}</span>
                          <span className="text-[9px] font-bold opacity-60 uppercase">{lang.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: QR POSTER GENERATOR */}
          {activeTab === 'posters' && (
            <div className="space-y-6 animate-fade-in print:p-0">
              
              {/* Heading Panel info */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-5 print:hidden">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">QR Poster Designer</h1>
                  <p className="text-slate-400 text-xs mt-0.5">Generate highly-styled, printable table stands and wall posters.</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Poster
                </button>
              </div>

              {/* Customizer Designer panel split layout */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start print:grid-cols-1 print:gap-0">
                
                {/* Customize controllers */}
                <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 print:hidden">
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Poster Design Tools</h3>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Layout Template</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'stand', label: 'Table Stand' },
                        { id: 'poster', label: 'Reception Poster' },
                        { id: 'counter', label: 'Counter Sticker' },
                        { id: 'wall', label: 'Wall Banner' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setPosterLayout(t.id as any)}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer text-center ${
                            posterLayout === t.id
                              ? 'border-blue-600 bg-blue-50/20 text-blue-600'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Poster Size</label>
                    <div className="flex gap-2">
                      {['A4', 'A5'].map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setPosterSize(sz as any)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer text-center ${
                            posterSize === sz
                              ? 'border-blue-600 bg-blue-50/20 text-blue-600'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Brand Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={posterColor}
                        onChange={(e) => setPosterColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-500 uppercase">{posterColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Headline (Call To Action)</label>
                    <input
                      type="text"
                      value={posterCtaText}
                      onChange={(e) => setPosterCtaText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subheadline Instruction</label>
                    <input
                      type="text"
                      value={posterSubCtaText}
                      onChange={(e) => setPosterSubCtaText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Poster Live Canvas Preview Mockup */}
                <div className="md:col-span-3 flex justify-center print:w-full">
                  <div 
                    id="printable-poster-area"
                    className="w-full max-w-[360px] bg-white rounded-3xl border border-slate-300 shadow-xl p-8 text-center flex flex-col justify-between items-center relative overflow-hidden transition-all duration-300 aspect-[1/1.414]"
                    style={{ borderColor: posterColor, borderWidth: '8px' }}
                  >
                    {/* Top logo indicator */}
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-md mb-2"
                        style={{ backgroundColor: posterColor }}
                      >
                        {organization.name.substring(0, 2).toUpperCase()}
                      </div>
                      <h2 className="font-extrabold text-slate-800 text-lg tracking-tight mt-1">{organization.name}</h2>
                    </div>

                    {/* Central CTA section */}
                    <div className="my-auto py-6 flex flex-col items-center w-full">
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-6 h-6 text-amber-400 fill-current" />
                        ))}
                      </div>

                      <h1 className="text-xl font-black text-slate-900 tracking-tight leading-snug px-2">
                        ⭐ {posterCtaText}
                      </h1>
                      <p className="text-slate-400 text-xs mt-2 px-6">
                        {posterSubCtaText}
                      </p>

                      {/* Live generated QR code mockup */}
                      <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner relative group flex items-center justify-center w-40 h-40">
                        {/* QR Code image source or SVG */}
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=${posterColor.replace('#', '')}&data=${encodeURIComponent(
                            typeof window !== 'undefined'
                              ? `${window.location.origin}/r/${organization.slug}/main`
                              : `https://reviewbee.app/r/${organization.slug}/main`
                          )}`}
                          alt="Review QR Code"
                          className="w-32 h-32 object-contain"
                        />
                      </div>
                    </div>

                    {/* Footer instructions */}
                    <div className="w-full flex flex-col items-center">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-extrabold text-slate-500 uppercase tracking-widest border border-slate-200/50">
                        Scan with your smartphone camera
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-3">Powered by ReviewBee.app</p>
                    </div>

                  </div>
                </div>

              </div>

              {/* Print layout custom CSS injection */}
              <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                  body {
                    background: white !important;
                    color: black !important;
                  }
                  header, aside, main > div > div:not(#printable-poster-area), 
                  .print\\:hidden, #printable-poster-area ~ * {
                    display: none !important;
                  }
                  main {
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  #printable-poster-area {
                    border: 8px solid ${posterColor} !important;
                    max-width: 100% !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    margin: 0 !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                  }
                }
              `}} />

            </div>
          )}

          {/* TAB 6: FULL ACCESS PLAN OVERVIEW */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-fade-in print:hidden">
              <div className="border-b border-slate-200 pb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Full Access Active
                  </span>
                  <span className="text-xs text-slate-400 font-medium">• No Plan Limits</span>
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Platform Access & Capabilities</h1>
                <p className="text-slate-400 text-xs mt-0.5">Your organization has full, unrestricted access to all ReviewBee features with zero branch caps or usage limits.</p>
              </div>

              {/* Hero Status Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-4">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>ReviewBee Enterprise Suite • 100% Unlocked</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                    Full Access Granted to Everyone
                  </h2>
                  <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                    All business workspaces operate with unrestricted enterprise privileges. You have unlimited branch locations, unlimited QR scan traffic, Multi-lingual customer review drafts, and custom survey questionnaires without any paywalls or locked tiers.
                  </p>
                </div>
              </div>

              {/* Unlocked Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
                      <Building className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Unlimited Branches</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Create and manage unlimited business locations, outlets, or gym floors with individual Google Place IDs.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" /> No caps / Unlimited
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Smart Review Drafting</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Automated review drafting with customizable tone (Friendly, Professional, Luxury, Simple) and length options.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" /> Fully customizable
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm">All 4 Languages</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      English, Malayalam (മലയാളം), Hindi (हिन्दी), and Arabic (العربية) enabled across all customer touchpoints.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" /> All languages active
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm">QR Poster Designer</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Print-ready table stands, reception posters, counter stickers, and wall banners in A4 and A5 sizes.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5" /> High-res vector exports
                  </div>
                </div>
              </div>

              {/* Status details card */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Workspace Status: Enterprise Active</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Workspace ID: {organization.id} • Slug: {organization.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200">
                    Lifetime Full Access
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* --- REVIEW DRAFT PREVIEW MODAL --- */}
      {showAISimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden relative text-slate-800">
            
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Review Draft Preview
                    </h3>
                    <p className="text-slate-500 text-xs">Simulate how customer responses are formulated into a review draft.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAISimulator(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Controls */}
              <div className="space-y-4 mb-5">
                {/* Star rating selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Customer Experience Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => {
                          setSimRating(stars);
                          handleRunAISimulation(stars, simTone, simLang);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                          simRating === stars
                            ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{stars}★</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone & Language Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Writing Style
                    </label>
                    <select
                      value={simTone}
                      onChange={(e) => {
                        setSimTone(e.target.value);
                        handleRunAISimulation(simRating, e.target.value, simLang);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="friendly">Friendly (Warm & welcoming)</option>
                      <option value="professional">Professional (Direct & crisp)</option>
                      <option value="luxury">Luxury (Sophisticated)</option>
                      <option value="simple">Simple (Brief & direct)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Language
                    </label>
                    <select
                      value={simLang}
                      onChange={(e) => {
                        setSimLang(e.target.value);
                        handleRunAISimulation(simRating, simTone, e.target.value);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="ml">Malayalam (മലയാളം)</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="ar">Arabic (العربية)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Output Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Review Draft Output
                  </span>
                  {isSimGenerating ? (
                    <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Drafting...
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      ✓ Ready for Google Reviews
                    </span>
                  )}
                </div>

                <div className="relative bg-slate-50 rounded-xl p-4 border border-slate-200 min-h-[90px] flex items-center text-slate-800 text-xs sm:text-sm leading-relaxed">
                  <p>
                    {simDraft || "Click 'Regenerate' to preview a review draft."}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ai');
                    setShowAISimulator(false);
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-4 cursor-pointer"
                >
                  Manage Review Settings →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunAISimulation()}
                    disabled={isSimGenerating}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSimGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (simDraft) {
                        navigator.clipboard.writeText(simDraft);
                        setSimCopied(true);
                        setTimeout(() => setSimCopied(false), 2000);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    {simCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
