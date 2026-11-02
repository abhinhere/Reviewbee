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
  MessageSquare,
  Download,
  ExternalLink
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

  const [activeTab, setActiveTab] = useState<'analytics' | 'branches' | 'questions' | 'ai' | 'posters'>('analytics');

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

    // Poster / Display Stand Config State
  const [selectedPosterBranchId, setSelectedPosterBranchId] = useState<string>('');
  const [posterDestination, setPosterDestination] = useState<'assistant' | 'direct'>('assistant');
  const [posterPaperSize, setPosterPaperSize] = useState<'stand' | 'a5' | 'a4'>('stand');
  const [showBusinessFooter, setShowBusinessFooter] = useState<boolean>(false);
  const [copiedPosterLink, setCopiedPosterLink] = useState(false);
  const [isDownloadingStand, setIsDownloadingStand] = useState(false);
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
              { id: 'posters', label: 'QR Display Stand', icon: QrCode },
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

          {/* TAB 5: GOOGLE REVIEW STAND / QR CODE */}
          {activeTab === 'posters' && (() => {
            const currentBranch = branches.find((b) => b.id === selectedPosterBranchId) || branches[0];
            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://reviewbee.app';
            const assistantUrl = organization ? `${origin}/r/${organization.slug}/${currentBranch?.slug || 'main'}` : '';
            const directUrl = currentBranch?.google_review_url
              ? currentBranch.google_review_url
              : currentBranch?.google_place_id
                ? `https://search.google.com/local/writereview?placeid=${currentBranch.google_place_id}`
                : assistantUrl;
            
            const targetUrl = posterDestination === 'direct' ? directUrl : assistantUrl;
            const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=0&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(targetUrl)}`;

            const handleCopyLink = () => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(targetUrl);
                setCopiedPosterLink(true);
                setTimeout(() => setCopiedPosterLink(false), 2000);
              }
            };

            const handleDownloadQrOnly = () => {
              const link = document.createElement('a');
              link.href = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=1&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(targetUrl)}`;
              link.target = '_blank';
              link.download = `google-review-qr-${currentBranch?.slug || 'code'}.png`;
              link.click();
            };

            const handleDownloadStandPng = async () => {
              setIsDownloadingStand(true);
              try {
                const canvas = document.createElement('canvas');
                canvas.width = 1000;
                canvas.height = 1400;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Google 4-Color Logo
                const googleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>`;
                const gBlob = new Blob([googleSvg], { type: 'image/svg+xml;charset=utf-8' });
                const gUrl = URL.createObjectURL(gBlob);
                const gImg = new Image();
                await new Promise((res) => {
                  gImg.onload = () => {
                    ctx.drawImage(gImg, 390, 110, 220, 220);
                    URL.revokeObjectURL(gUrl);
                    res(null);
                  };
                  gImg.onerror = () => res(null);
                  gImg.src = gUrl;
                });

                // Text: review us
                ctx.fillStyle = '#3c4043';
                ctx.font = '400 52px system-ui, -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('review us', 500, 395);

                // Text: on Google
                ctx.fillStyle = '#202124';
                ctx.font = '700 86px system-ui, -apple-system, sans-serif';
                ctx.fillText('on Google', 500, 490);

                // 5 Gold Stars (#FBBC04)
                const starCount = 5;
                const starOuterRadius = 26;
                const starInnerRadius = 13;
                const starSpacing = 68;
                const startX = 500 - ((starCount - 1) * starSpacing) / 2;
                const starY = 550;

                const drawStar = (cx: number, cy: number) => {
                  let rot = (Math.PI / 2) * 3;
                  const step = Math.PI / 5;
                  ctx.beginPath();
                  ctx.moveTo(cx, cy - starOuterRadius);
                  for (let i = 0; i < 5; i++) {
                    ctx.lineTo(cx + Math.cos(rot) * starOuterRadius, cy + Math.sin(rot) * starOuterRadius);
                    rot += step;
                    ctx.lineTo(cx + Math.cos(rot) * starInnerRadius, cy + Math.sin(rot) * starInnerRadius);
                    rot += step;
                  }
                  ctx.closePath();
                  ctx.fillStyle = '#FBBC04';
                  ctx.fill();
                };

                for (let i = 0; i < starCount; i++) {
                  drawStar(startX + i * starSpacing, starY);
                }

                // QR Code
                const qrImg = new Image();
                qrImg.crossOrigin = 'anonymous';
                await new Promise((res) => {
                  qrImg.onload = () => {
                    ctx.drawImage(qrImg, 275, 630, 450, 450);
                    res(null);
                  };
                  qrImg.onerror = () => res(null);
                  qrImg.src = qrImageSrc;
                });

                // Optional business footer
                if (showBusinessFooter && currentBranch) {
                  ctx.fillStyle = '#70757a';
                  ctx.font = '600 28px system-ui, -apple-system, sans-serif';
                  ctx.fillText(currentBranch.name, 500, 1180);
                }

                const dataUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = dataUrl;
                downloadLink.download = `Google-Review-Stand-${currentBranch?.slug || 'stand'}.png`;
                downloadLink.click();
              } catch (err) {
                console.error('Error generating stand PNG:', err);
              } finally {
                setIsDownloadingStand(false);
              }
            };

            return (
              <div className="space-y-6 animate-fade-in print:p-0">
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <QrCode className="w-6 h-6 text-blue-600" />
                      Google Review Display Stand
                    </h1>
                    <p className="text-slate-500 text-xs mt-1">
                      Official Google tabletop stand design ready for acrylic display and high-res printing.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleDownloadStandPng}
                      disabled={isDownloadingStand}
                      className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      {isDownloadingStand ? 'Generating PNG...' : 'Download Image'}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      Print Stand
                    </button>
                  </div>
                </div>

                {/* 2-Column Layout: Controls & Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block print:gap-0">
                  
                  {/* Left Column: Stand Configuration */}
                  <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5 print:hidden">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
                      <span>Display Stand Settings</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Official Google Style
                      </span>
                    </h3>

                    {/* Branch Selection */}
                    {branches.length > 1 && (
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Select Location / Branch
                        </label>
                        <select
                          value={selectedPosterBranchId || currentBranch?.id}
                          onChange={(e) => setSelectedPosterBranchId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* QR Code Routing Destination */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Scan Destination
                      </label>
                      <div className="space-y-2">
                        <label
                          onClick={() => setPosterDestination('assistant')}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            posterDestination === 'assistant'
                              ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="posterDestination"
                            checked={posterDestination === 'assistant'}
                            onChange={() => setPosterDestination('assistant')}
                            className="mt-0.5 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              Reviewbee Smart Review Flow
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded">Recommended</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              Helps customers draft authentic 5-star Google reviews and filters unhappy customers to private feedback.
                            </p>
                          </div>
                        </label>

                        <label
                          onClick={() => setPosterDestination('direct')}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            posterDestination === 'direct'
                              ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="posterDestination"
                            checked={posterDestination === 'direct'}
                            onChange={() => setPosterDestination('direct')}
                            className="mt-0.5 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              Direct Google Review Box
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              Opens Google Maps write-review dialog directly on customer's phone without the interactive assistant.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Paper & Stand Format */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Print Size Format
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'stand', label: 'Acrylic Stand', sub: '4" × 6"' },
                          { id: 'a5', label: 'A5 Card', sub: '14.8 × 21 cm' },
                          { id: 'a4', label: 'A4 Poster', sub: '21 × 29.7 cm' },
                        ].map((sz) => (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => setPosterPaperSize(sz.id as any)}
                            className={`py-2 px-2 rounded-xl border text-center transition cursor-pointer ${
                              posterPaperSize === sz.id
                                ? 'border-blue-600 bg-blue-50/30 text-blue-600 font-bold'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-xs">{sz.label}</div>
                            <div className="text-[10px] opacity-60 font-normal">{sz.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Optional footer label toggle */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-700">Show Location / Branch Name</div>
                        <div className="text-[11px] text-slate-400">Display location subtitle at the stand bottom</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={showBusinessFooter}
                        onChange={(e) => setShowBusinessFooter(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Review URL Preview & Copy */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>QR Code Target URL</span>
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          Test Link <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-xs text-slate-700 font-mono bg-white p-2 rounded border border-slate-200 truncate select-all">
                        {targetUrl}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="flex-1 py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          {copiedPosterLink ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadQrOnly}
                          className="py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Download high-resolution black & white QR code PNG"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>QR Only</span>
                        </button>
                      </div>
                    </div>

                    {/* Pro tip advice */}
                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-800 leading-relaxed">
                      <span className="font-bold">Tabletop Stand Recommendation:</span> Print on standard 250–300 GSM white cardstock and slip into a vertical clear or white L-shaped acrylic tabletop holder.
                    </div>
                  </div>

                  {/* Right Column: Exact Match Google Review Acrylic Stand Mockup */}
                  <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-100/60 rounded-3xl border border-slate-200/70 print:p-0 print:bg-white print:border-none">
                    
                    {/* Stand Mockup Assembly */}
                    <div className="relative flex flex-col items-center w-full max-w-[340px] sm:max-w-[380px]">
                      
                      {/* Stand Face (Card) */}
                      <div
                        id="printable-poster-area"
                        className="w-full bg-white rounded-t-[32px] rounded-b-xl shadow-2xl border border-slate-200/80 px-8 pt-10 pb-9 text-center flex flex-col items-center relative overflow-hidden select-none"
                        style={{
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        {/* Official Google 4-Color "G" SVG */}
                        <div className="flex justify-center mb-4">
                          <svg className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-sm" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        </div>

                        {/* Exact Typography: "review us" and "on Google" */}
                        <div className="flex flex-col items-center">
                          <p className="text-[#3c4043] text-xl sm:text-2xl font-normal lowercase tracking-normal leading-tight font-sans">
                            review us
                          </p>
                          <h2 className="text-[#202124] text-3xl sm:text-4xl font-bold tracking-tight leading-tight mt-0.5 font-sans">
                            on Google
                          </h2>
                        </div>

                        {/* 5 Solid Gold Stars (#FBBC04) */}
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 mb-5 sm:mb-6">
                          {[1, 2, 3, 4, 5].map((starIndex) => (
                            <svg
                              key={starIndex}
                              className="w-7 h-7 sm:w-8 sm:h-8"
                              viewBox="0 0 24 24"
                              fill="#FBBC04"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                        </div>

                        {/* High-Resolution Black & White QR Code */}
                        <div className="bg-white p-2 rounded-xl flex items-center justify-center shadow-xs">
                          <img
                            src={qrImageSrc}
                            alt="Google Review QR Code"
                            className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        {/* Optional subtle footer */}
                        {showBusinessFooter && currentBranch && (
                          <div className="mt-4 pt-3 border-t border-slate-100 w-full text-center">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              {currentBranch.name}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Acrylic Stand L-Base Lip (Mockup Presentation) */}
                      <div
                        className="w-full h-8 bg-gradient-to-b from-slate-200 via-white to-slate-200 rounded-b-2xl shadow-xl border-x border-b border-slate-300 relative -mt-0.5 print:hidden"
                        style={{
                          transform: 'perspective(350px) rotateX(32deg)',
                          transformOrigin: 'top center',
                          boxShadow: '0 16px 28px -6px rgba(0, 0, 0, 0.28)',
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-70" />
                      </div>

                      {/* Stand Drop Shadow */}
                      <div className="w-[85%] h-4 bg-slate-400/25 blur-md rounded-full mt-2 print:hidden" />
                    </div>

                    {/* Quick Action Pills Under Stand */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8 print:hidden">
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Print Display Stand
                      </button>
                      <button
                        onClick={handleDownloadStandPng}
                        disabled={isDownloadingStand}
                        className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-slate-500" />
                        {isDownloadingStand ? 'Generating...' : 'Download Stand (PNG)'}
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        {copiedPosterLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                </div>

                {/* Print Layout CSS Injection */}
                <style dangerouslySetInnerHTML={{
                  __html: `
                  @media print {
                    @page {
                      margin: 1.5cm;
                      size: auto;
                    }
                    body {
                      background: #ffffff !important;
                      color: #000000 !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                    header, aside, main > div > div:not(.space-y-6),
                    .print\\:hidden,
                    button, nav, .print\\:hidden * {
                      display: none !important;
                    }
                    main {
                      padding: 0 !important;
                      margin: 0 !important;
                    }
                    #printable-poster-area {
                      box-shadow: none !important;
                      border: 1px dashed #cbd5e1 !important;
                      border-radius: 28px !important;
                      max-width: 440px !important;
                      width: 100% !important;
                      margin: 1cm auto !important;
                      padding: 2.5rem 2rem !important;
                      page-break-inside: avoid !important;
                      background: #ffffff !important;
                    }
                    #printable-poster-area img {
                      width: 220px !important;
                      height: 220px !important;
                    }
                  }
                `}} />

              </div>
            );
          })()}

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
