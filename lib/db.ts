// ReviewBee Database Access & Simulation Layer

import { createClient } from '@supabase/supabase-js';

// --- DATA STRUCTURES ---

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  role: 'super_admin' | 'owner' | 'manager' | 'staff';
  full_name: string;
  created_at: string;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  google_place_id: string | null;
  google_review_url: string;
  primary_color: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Settings {
  id: string;
  organization_id: string;
  ai_writing_tone: 'friendly' | 'professional' | 'luxury' | 'simple';
  ai_review_length: 'short' | 'medium' | 'long';
  enabled_languages: string[]; // e.g. ['en', 'ml', 'hi', 'ar']
}

export interface QuestionSet {
  id: string;
  organization_id: string;
  name: string;
  category: 'restaurant' | 'salon' | 'retail' | 'clinic' | 'hotel' | 'gym' | 'education' | 'custom';
  is_active: boolean;
}

export interface ReviewQuestion {
  id: string;
  question_set_id: string;
  organization_id: string;
  question_text: { [lang: string]: string }; // Translate map e.g. {"en": "..."}
  question_type: 'star_rating' | 'single_choice' | 'multiple_choice' | 'text_input' | 'emoji_selection';
  options: { [lang: string]: string[] } | null; // Option choices translations
  is_required: boolean;
  sort_order: number;
  is_enabled: boolean;
}

export interface ReviewSession {
  id: string;
  branch_id: string;
  language: string;
  started_at: string;
  completed_at: string | null;
  answers: Record<string, any>;
  device_info: Record<string, any>;
  rating: number | null;
}

export interface GeneratedReview {
  id: string;
  review_session_id: string | null;
  branch_id: string;
  original_text: string;
  edited_text: string;
  rating: number;
  language: string;
  is_copied: boolean;
  is_redirected: boolean;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  branch_id: string;
  event_type: 'qr_scan' | 'session_start' | 'review_generated' | 'visit_google_review' | 'copy_review';
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  language: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan_name: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'unpaid' | 'past_due';
  current_period_start: string;
  current_period_end: string;
}

// --- INITIALIZATION ---

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// --- LOCAL STORAGE MOCK DATABASE (DEMO MODE) ---

const MOCK_STORAGE_KEY = 'reviewbee_db_store';

interface DatabaseStore {
  organizations: Organization[];
  profiles: Profile[];
  branches: Branch[];
  settings: Settings[];
  questionSets: QuestionSet[];
  reviewQuestions: ReviewQuestion[];
  reviewSessions: ReviewSession[];
  generatedReviews: GeneratedReview[];
  analytics: AnalyticsEvent[];
  subscriptions: Subscription[];
  currentUser: { id: string; email: string; full_name: string; organization_id: string } | null;
}

const DEFAULT_STORE = (): DatabaseStore => {
  const orgId = 'org-default-uuid';
  const branchId = 'branch-default-uuid';
  const qSetId = 'qset-default-uuid';

  return {
    organizations: [
      {
        id: orgId,
        name: 'MadeFit Gym',
        slug: 'madefit',
        logo_url: null,
        primary_color: '#3B82F6',
        created_at: new Date().toISOString(),
      },
    ],
    profiles: [
      {
        id: 'user-default-uuid',
        organization_id: orgId,
        role: 'owner',
        full_name: 'John Fit',
        created_at: new Date().toISOString(),
      },
    ],
    branches: [
      {
        id: branchId,
        organization_id: orgId,
        name: 'Main Fitness Arena',
        slug: 'main',
        google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83tdY4',
        google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83tdY4',
        primary_color: '#3B82F6',
        logo_url: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'branch-south-uuid',
        organization_id: orgId,
        name: 'South Branch',
        slug: 'south',
        google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83tdY4',
        google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83tdY4',
        primary_color: '#10B981',
        logo_url: null,
        created_at: new Date().toISOString(),
      },
    ],
    settings: [
      {
        id: 'settings-default-uuid',
        organization_id: orgId,
        ai_writing_tone: 'friendly',
        ai_review_length: 'medium',
        enabled_languages: ['en', 'ml', 'hi', 'ar'],
      },
    ],
    questionSets: [
      {
        id: qSetId,
        organization_id: orgId,
        name: 'Gym Default Questions',
        category: 'gym',
        is_active: true,
      },
    ],
    reviewQuestions: [
      {
        id: 'q1',
        question_set_id: qSetId,
        organization_id: orgId,
        question_text: {
          en: 'How would you rate your overall experience with our gym workout?',
          ml: 'ഞങ്ങളുടെ ജിമ്മിലെ നിങ്ങളുടെ ആകെ അനുഭവം എങ്ങനെയുണ്ടായിരുന്നു?',
          hi: 'हमारे जिम में आपका समग्र अनुभव कैसा रहा?',
          ar: 'كيف تقيم تجربتك العامة مع الصالة الرياضية؟',
        },
        question_type: 'star_rating',
        options: null,
        is_required: true,
        sort_order: 1,
        is_enabled: true,
      },
      {
        id: 'q2',
        question_set_id: qSetId,
        organization_id: orgId,
        question_text: {
          en: 'Which training services did you use today?',
          ml: 'ഇന്ന് നിങ്ങൾ ഏതൊക്കെ പരിശീലന സേവനങ്ങളാണ് ഉപയോഗിച്ചത്?',
          hi: 'आज आपने किन प्रशिक्षण सेवाओं का उपयोग किया?',
          ar: 'ما هي خدمات التدريب التي استخدمتها اليوم؟',
        },
        question_type: 'multiple_choice',
        options: {
          en: ['Cardio Zone', 'Strength Training', 'Personal Trainer', 'Yoga Classes', 'Group Workout'],
          ml: ['കാർഡിയോ വിഭാഗം', 'സ്ട്രെങ്ത് ട്രെയിനിംഗ്', 'വ്യക്തിഗത പരിശീലകൻ', 'യോഗ ക്ലാസുകൾ', 'ഗ്രൂപ്പ് വർക്കൗട്ട്'],
          hi: ['कार्डियो जोन', 'स्ट्रेंथ ट्रेनिंग', 'पर्सनल ट्रेनर', 'योग कक्षाएं', 'ग्रुप वर्कआउट'],
          ar: ['منطقة الكارديو', 'تدريب القوة', 'مدرب شخصي', 'دروس اليوغا', 'التدريب الجماعي'],
        },
        is_required: false,
        sort_order: 2,
        is_enabled: true,
      },
      {
        id: 'q3',
        question_set_id: qSetId,
        organization_id: orgId,
        question_text: {
          en: 'How was the behavior of our staff and fitness trainers?',
          ml: 'ഞങ്ങളുടെ ജീവനക്കാരുടെയും ഫിറ്റ്നസ് ട്രെയിനർമാരുടെയും പെരുമാറ്റം എങ്ങനെയുണ്ടായിരുന്നു?',
          hi: 'हमारे स्टाफ और फिटनेस ट्रेनर्स का व्यवहार कैसा था?',
          ar: 'كيف كان سلوك موظفينا ومدربي اللياقة البدنية؟',
        },
        question_type: 'emoji_selection',
        options: {
          en: ['Friendly/Helpful 😊', 'Professional/Strict 👍', 'Average 😐', 'Needs Improvement 🙁'],
          ml: ['സൗഹൃദപരം 😊', 'പ്രൊഫഷണൽ 👍', 'ശരാശരി 😐', 'മെച്ചപ്പെടാനുണ്ട് 🙁'],
          hi: ['मैत्रीपूर्ण/सहायक 😊', 'पेशेवर/सख्त 👍', 'औसत 😐', 'सुधार की आवश्यकता 🙁'],
          ar: ['ودود/مساعد 😊', 'مهني/صارم 👍', 'متوسط 😐', 'بحاجة إلى تحسين 🙁'],
        },
        is_required: true,
        sort_order: 3,
        is_enabled: true,
      },
      {
        id: 'q4',
        question_set_id: qSetId,
        organization_id: orgId,
        question_text: {
          en: 'Would you recommend ReviewBee Fitness Center to others?',
          ml: 'മറ്റുള്ളവർക്ക് നിങ്ങൾ ഞങ്ങളുടെ ജിം ശുപാർശ ചെയ്യുമോ?',
          hi: 'क्या आप दूसरों को हमारे जिम की सिफारिश करेंगे?',
          ar: 'هل توصي بمركز اللياقة البدنية للآخرين؟',
        },
        question_type: 'single_choice',
        options: {
          en: ['Definitely Yes!', 'Maybe', 'No'],
          ml: ['തീർച്ചയായും പറയും!', 'ഒരുപക്ഷേ', 'ഇല്ല'],
          hi: ['निश्चित रूप से हाँ!', 'शायद', 'नहीं'],
          ar: ['بالتأكيد نعم!', 'ربما', 'لا'],
        },
        is_required: true,
        sort_order: 4,
        is_enabled: true,
      },
      {
        id: 'q5',
        question_set_id: qSetId,
        organization_id: orgId,
        question_text: {
          en: 'Any specific feedback or trainer name you would like to mention?',
          ml: 'പ്രത്യേകം എന്തെങ്കിലും അഭിപ്രായമോ ട്രെയിനറുടെ പേരോ പറയണമെന്നുണ്ടോ?',
          hi: 'कोई विशिष्ट प्रतिक्रिया या ट्रेनर का नाम जिसका आप उल्लेख करना चाहेंगे?',
          ar: 'أي ملاحظات محددة أو اسم مدرب ترغب في ذكره؟',
        },
        question_type: 'text_input',
        options: null,
        is_required: false,
        sort_order: 5,
        is_enabled: true,
      },
    ],
    reviewSessions: [],
    generatedReviews: [],
    analytics: [
      // Generate some seed data for analytics charts (last 30 days)
      ...Array.from({ length: 90 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(i / 3)); // 3 events per day
        const eventTypes: Array<AnalyticsEvent['event_type']> = [
          'qr_scan',
          'session_start',
          'review_generated',
          'visit_google_review',
          'copy_review',
        ];
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const deviceTypes: Array<AnalyticsEvent['device_type']> = ['mobile', 'tablet', 'desktop'];
        
        return {
          id: `analytics-${i}`,
          branch_id: i % 3 === 0 ? 'branch-south-uuid' : branchId,
          event_type: randomType,
          device_type: deviceTypes[Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : 2) : 0], // Mostly mobile
          browser: Math.random() > 0.4 ? 'Chrome Mobile' : (Math.random() > 0.5 ? 'Safari' : 'Firefox Mobile'),
          language: Math.random() > 0.5 ? 'en' : (Math.random() > 0.4 ? 'ml' : 'hi'),
          created_at: date.toISOString(),
        };
      }),
    ],
    subscriptions: [
      {
        id: 'sub-default-uuid',
        organization_id: orgId,
        plan_name: 'enterprise',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    currentUser: {
      id: 'user-default-uuid',
      email: 'owner@madefit.com',
      full_name: 'John Fit',
      organization_id: orgId,
    },
  };
};

class MockDatabase {
  private getStore(): DatabaseStore {
    if (typeof window === 'undefined') return DEFAULT_STORE();
    const data = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!data) {
      const defaultData = DEFAULT_STORE();
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(data);
  }

  private saveStore(store: DatabaseStore) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store));
    }
  }

  // --- Auth Simulation ---
  getCurrentUser() {
    const store = this.getStore();
    return store.currentUser;
  }

  login(email: string) {
    const store = this.getStore();
    // Simple signin / sign up simulation
    let profile = store.profiles.find((p) => true); // just find first demo profile
    if (!profile) {
      // Re-initialize default store if profile missing
      const fresh = DEFAULT_STORE();
      this.saveStore(fresh);
      return fresh.currentUser;
    }
    const org = store.organizations.find((o) => o.id === profile?.organization_id);
    store.currentUser = {
      id: profile.id,
      email: email,
      full_name: profile.full_name || 'Business Owner',
      organization_id: profile.organization_id,
    };
    this.saveStore(store);
    return store.currentUser;
  }

  loginWithGoogle(account?: { email?: string; name?: string; organizationName?: string }) {
    const store = this.getStore();
    const email = account?.email || 'owner@madefit.com';
    const fullName = account?.name || 'John Fit';
    const orgName = account?.organizationName || 'MadeFit Gym';

    let profile = store.profiles.find(
      (p) => p.full_name?.toLowerCase() === fullName.toLowerCase() || p.id === store.currentUser?.id
    );
    if (!profile) {
      profile = store.profiles[0];
    }

    if (!profile) {
      return this.signup(email, fullName, orgName);
    }

    store.currentUser = {
      id: profile.id,
      email: email,
      full_name: fullName,
      organization_id: profile.organization_id,
    };
    this.saveStore(store);
    return store.currentUser;
  }

  signup(email: string, fullName: string, orgName: string) {
    const store = this.getStore();
    const orgId = `org-${Math.random().toString(36).substr(2, 9)}`;
    const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
    const branchId = `branch-${Math.random().toString(36).substr(2, 9)}`;
    const qSetId = `qset-${Math.random().toString(36).substr(2, 9)}`;

    const newOrg: Organization = {
      id: orgId,
      name: orgName,
      slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'my-business',
      logo_url: null,
      primary_color: '#3B82F6',
      created_at: new Date().toISOString(),
    };

    const newProfile: Profile = {
      id: userId,
      organization_id: orgId,
      role: 'owner',
      full_name: fullName,
      created_at: new Date().toISOString(),
    };

    const newBranch: Branch = {
      id: branchId,
      organization_id: orgId,
      name: 'Main Center',
      slug: 'main',
      google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83tdY4',
      google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83tdY4',
      primary_color: '#3B82F6',
      logo_url: null,
      created_at: new Date().toISOString(),
    };

    const newSettings: Settings = {
      id: `settings-${orgId}`,
      organization_id: orgId,
      ai_writing_tone: 'friendly',
      ai_review_length: 'medium',
      enabled_languages: ['en', 'ml', 'hi', 'ar'],
    };

    const newQSet: QuestionSet = {
      id: qSetId,
      organization_id: orgId,
      name: `${orgName} Survey`,
      category: 'restaurant',
      is_active: true,
    };

    // Add standard review questions for new account
    const standardQuestions: ReviewQuestion[] = [
      {
        id: `q-${orgId}-1`,
        question_set_id: qSetId,
        organization_id: orgId,
        question_text: {
          en: 'Rate your overall experience with us',
          ml: 'ഞങ്ങളെക്കുറിച്ചുള്ള നിങ്ങളുടെ ആകെ അനുഭവം വിലയിരുത്തുക',
          hi: 'हमारे साथ अपने समग्र अनुभव को रेट करें',
          ar: 'قيم تجربتك العامة معنا',
        },
        question_type: 'star_rating',
        options: null,
        is_required: true,
        sort_order: 1,
        is_enabled: true,
      },
      {
        id: `q-${orgId}-2`,
        question_set_id: qSetId,
        organization_id: orgId,
        question_text: {
          en: 'What did you like the most about our service?',
          ml: 'ഞങ്ങളുടെ സേവനത്തിൽ നിങ്ങൾ ഏറ്റവും ഇഷ്ടപ്പെട്ടത് എന്താണ്?',
          hi: 'आपको हमारी सेवा में सबसे अच्छा क्या लगा?',
          ar: 'ما الذي أعجبك أكثر في خدمتنا؟',
        },
        question_type: 'single_choice',
        options: {
          en: ['Quality of Service', 'Staff Friendliness', 'Quick Turnaround', 'Cleanliness & Ambiance'],
          ml: ['സേവനത്തിന്റെ നിലവാരം', 'ജീവനക്കാരുടെ സൗഹൃദ മനോഭാവം', 'ദ്രുതഗതിയിലുള്ള പ്രതികരണം', 'വൃത്തിയും വെടിപ്പും'],
          hi: ['सेवा की गुणवत्ता', 'कर्मचारियों का दोस्ताना व्यवहार', 'त्वरित सेवा', 'स्वच्छता और माहौल'],
          ar: ['جودة الخدمة', 'ود الموظفين', 'سرعة الإنجاز', 'النظافة والأجواء'],
        },
        is_required: false,
        sort_order: 2,
        is_enabled: true,
      },
      {
        id: `q-${orgId}-3`,
        question_set_id: qSetId,
        organization_id: orgId,
        question_text: {
          en: 'Any details you would like to share?',
          ml: 'കൂടുതലായി എന്തെങ്കിലും പങ്കുവെക്കാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?',
          hi: 'क्या आप कोई विवरण साझा करना चाहेंगे?',
          ar: 'هل تود مشاركة أي تفاصيل؟',
        },
        question_type: 'text_input',
        options: null,
        is_required: false,
        sort_order: 3,
        is_enabled: true,
      },
    ];

    store.organizations.push(newOrg);
    store.profiles.push(newProfile);
    store.branches.push(newBranch);
    store.settings.push(newSettings);
    store.questionSets.push(newQSet);
    store.reviewQuestions.push(...standardQuestions);
    store.subscriptions.push({
      id: `sub-${orgId}`,
      organization_id: orgId,
      plan_name: 'starter',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    store.currentUser = {
      id: userId,
      email: email,
      full_name: fullName,
      organization_id: orgId,
    };

    this.saveStore(store);
    return store.currentUser;
  }

  logout() {
    const store = this.getStore();
    store.currentUser = null;
    this.saveStore(store);
  }

  // --- Read Methods ---
  getOrganization(orgId: string): Organization | undefined {
    return this.getStore().organizations.find((o) => o.id === orgId);
  }

  getOrganizationBySlug(slug: string): Organization | undefined {
    const store = this.getStore();
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = store.organizations.find(
      (o) =>
        o.slug.toLowerCase() === slug.toLowerCase() ||
        o.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug ||
        o.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanSlug) ||
        cleanSlug.includes(o.slug.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
    return found || store.organizations[0];
  }

  updateOrganization(orgId: string, updates: Partial<Organization>) {
    const store = this.getStore();
    const index = store.organizations.findIndex((o) => o.id === orgId);
    if (index !== -1) {
      store.organizations[index] = { ...store.organizations[index], ...updates };
      this.saveStore(store);
      return store.organizations[index];
    }
  }

  getProfile(userId: string): Profile | undefined {
    return this.getStore().profiles.find((p) => p.id === userId);
  }

  getBranches(orgId: string): Branch[] {
    return this.getStore().branches.filter((b) => b.organization_id === orgId);
  }

  getBranchBySlug(orgSlug: string, branchSlug: string): Branch | undefined {
    const store = this.getStore();
    const org = this.getOrganizationBySlug(orgSlug);
    if (!org) return store.branches[0];
    const cleanBranch = branchSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = store.branches.find(
      (b) =>
        b.organization_id === org.id &&
        (b.slug.toLowerCase() === branchSlug.toLowerCase() ||
         b.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanBranch)
    );
    return matched || store.branches.find((b) => b.organization_id === org.id) || store.branches[0];
  }

  createBranch(orgId: string, branch: Omit<Branch, 'id' | 'organization_id' | 'created_at'>) {
    const store = this.getStore();
    const newBranch: Branch = {
      id: `branch-${Math.random().toString(36).substr(2, 9)}`,
      organization_id: orgId,
      ...branch,
      created_at: new Date().toISOString(),
    };
    store.branches.push(newBranch);
    this.saveStore(store);
    return newBranch;
  }

  updateBranch(branchId: string, updates: Partial<Branch>) {
    const store = this.getStore();
    const index = store.branches.findIndex((b) => b.id === branchId);
    if (index !== -1) {
      store.branches[index] = { ...store.branches[index], ...updates };
      this.saveStore(store);
      return store.branches[index];
    }
  }

  deleteBranch(branchId: string) {
    const store = this.getStore();
    store.branches = store.branches.filter((b) => b.id !== branchId);
    this.saveStore(store);
  }

  getSettings(orgId: string): Settings {
    const store = this.getStore();
    let settings = store.settings.find((s) => s.organization_id === orgId);
    if (!settings) {
      settings = {
        id: `settings-${orgId}`,
        organization_id: orgId,
        ai_writing_tone: 'friendly',
        ai_review_length: 'medium',
        enabled_languages: ['en', 'ml', 'hi', 'ar'],
      };
      store.settings.push(settings);
      this.saveStore(store);
    }
    return settings;
  }

  updateSettings(orgId: string, updates: Partial<Settings>) {
    const store = this.getStore();
    const index = store.settings.findIndex((s) => s.organization_id === orgId);
    if (index !== -1) {
      store.settings[index] = { ...store.settings[index], ...updates };
    } else {
      store.settings.push({
        id: `settings-${orgId}`,
        organization_id: orgId,
        ai_writing_tone: updates.ai_writing_tone || 'friendly',
        ai_review_length: updates.ai_review_length || 'medium',
        enabled_languages: updates.enabled_languages || ['en', 'ml', 'hi', 'ar'],
      });
    }
    this.saveStore(store);
    return this.getSettings(orgId);
  }

  getSubscription(orgId: string): Subscription {
    const store = this.getStore();
    let sub = store.subscriptions.find((s) => s.organization_id === orgId);
    if (!sub) {
      sub = {
        id: `sub-${orgId}`,
        organization_id: orgId,
        plan_name: 'enterprise',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      store.subscriptions.push(sub);
      this.saveStore(store);
    }
    return sub;
  }

  updateSubscription(orgId: string, planName: Subscription['plan_name']) {
    const store = this.getStore();
    const index = store.subscriptions.findIndex((s) => s.organization_id === orgId);
    if (index !== -1) {
      store.subscriptions[index].plan_name = planName;
    } else {
      store.subscriptions.push({
        id: `sub-${orgId}`,
        organization_id: orgId,
        plan_name: planName,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    this.saveStore(store);
    return this.getSubscription(orgId);
  }

  // --- Questions Management ---
  getQuestionSets(orgId: string): QuestionSet[] {
    return this.getStore().questionSets.filter((qs) => qs.organization_id === orgId);
  }

  getQuestions(orgId: string): ReviewQuestion[] {
    return this.getStore().reviewQuestions.filter((q) => q.organization_id === orgId);
  }

  saveQuestions(orgId: string, questions: ReviewQuestion[]) {
    const store = this.getStore();
    // Filter out old questions for this org and insert new ones
    store.reviewQuestions = store.reviewQuestions.filter((q) => q.organization_id !== orgId);
    store.reviewQuestions.push(...questions);
    this.saveStore(store);
  }

  // --- Customer Wizard Actions ---
  createReviewSession(branchId: string, language: string) {
    const store = this.getStore();
    const newSession: ReviewSession = {
      id: `session-${Math.random().toString(36).substr(2, 9)}`,
      branch_id: branchId,
      language: language,
      started_at: new Date().toISOString(),
      completed_at: null,
      answers: {},
      device_info: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'mock-device',
        screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'mock-screen',
      },
      rating: null,
    };
    store.reviewSessions.push(newSession);
    this.saveStore(store);
    return newSession;
  }

  updateReviewSession(sessionId: string, rating: number, answers: Record<string, any>, completed: boolean = false) {
    const store = this.getStore();
    const index = store.reviewSessions.findIndex((s) => s.id === sessionId);
    if (index !== -1) {
      store.reviewSessions[index].rating = rating;
      store.reviewSessions[index].answers = answers;
      if (completed) {
        store.reviewSessions[index].completed_at = new Date().toISOString();
      }
      this.saveStore(store);
      return store.reviewSessions[index];
    }
  }

  createGeneratedReview(review: Omit<GeneratedReview, 'id' | 'created_at' | 'is_copied' | 'is_redirected'>) {
    const store = this.getStore();
    const newReview: GeneratedReview = {
      id: `review-${Math.random().toString(36).substr(2, 9)}`,
      ...review,
      is_copied: false,
      is_redirected: false,
      created_at: new Date().toISOString(),
    };
    store.generatedReviews.push(newReview);
    this.saveStore(store);
    return newReview;
  }

  updateGeneratedReviewStatus(reviewId: string, field: 'is_copied' | 'is_redirected', value: boolean) {
    const store = this.getStore();
    const index = store.generatedReviews.findIndex((r) => r.id === reviewId);
    if (index !== -1) {
      store.generatedReviews[index][field] = value;
      this.saveStore(store);
    }
  }

  // --- Analytics simulation ---
  recordEvent(branchId: string, eventType: AnalyticsEvent['event_type']) {
    const store = this.getStore();
    const newEvent: AnalyticsEvent = {
      id: `evt-${Math.random().toString(36).substr(2, 9)}`,
      branch_id: branchId,
      event_type: eventType,
      device_type: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
      browser: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Safari') : 'Chrome',
      language: typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en',
      created_at: new Date().toISOString(),
    };
    store.analytics.push(newEvent);
    this.saveStore(store);
  }

  getAnalyticsReport(branchId: string | 'all', orgId: string, rangeDays: number = 30) {
    const store = this.getStore();
    const branches = store.branches.filter((b) => b.organization_id === orgId);
    const branchIds = branchId === 'all' ? branches.map((b) => b.id) : [branchId];

    // Filter analytics in range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rangeDays);

    const relevantEvents = store.analytics.filter(
      (e) => branchIds.includes(e.branch_id) && new Date(e.created_at) >= cutoffDate
    );

    const scans = relevantEvents.filter((e) => e.event_type === 'qr_scan').length;
    const sessions = relevantEvents.filter((e) => e.event_type === 'session_start').length;
    const generated = relevantEvents.filter((e) => e.event_type === 'review_generated').length;
    const copied = relevantEvents.filter((e) => e.event_type === 'copy_review').length;
    const visits = relevantEvents.filter((e) => e.event_type === 'visit_google_review').length;

    // Calculate rating distribution from generated reviews in this branch list
    const branchReviews = store.generatedReviews.filter((r) => branchIds.includes(r.branch_id));
    const avgRating =
      branchReviews.length > 0
        ? Number((branchReviews.reduce((sum, r) => sum + r.rating, 0) / branchReviews.length).toFixed(1))
        : 4.5; // fallback

    // Conversion rate (visits divided by scans)
    const conversionRate = scans > 0 ? Math.round((visits / scans) * 100) : 0;
    const completionRate = sessions > 0 ? Math.round((generated / sessions) * 100) : 0;

    // Daily breakdown for charts
    const dailyDataMap: Record<string, { date: string; scans: number; generated: number; visits: number }> = {};
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dailyDataMap[label] = { date: label, scans: 0, generated: 0, visits: 0 };
    }

    relevantEvents.forEach((e) => {
      const dateLabel = new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (dailyDataMap[dateLabel]) {
        if (e.event_type === 'qr_scan') dailyDataMap[dateLabel].scans++;
        if (e.event_type === 'review_generated') dailyDataMap[dateLabel].generated++;
        if (e.event_type === 'visit_google_review') dailyDataMap[dateLabel].visits++;
      }
    });

    // Language Usage
    const langUsage: Record<string, number> = {};
    relevantEvents.forEach((e) => {
      langUsage[e.language] = (langUsage[e.language] || 0) + 1;
    });
    const languageData = Object.entries(langUsage).map(([name, value]) => ({ name, value }));

    // Device usage
    const deviceUsage = { mobile: 0, tablet: 0, desktop: 0 };
    relevantEvents.forEach((e) => {
      deviceUsage[e.device_type] = (deviceUsage[e.device_type] || 0) + 1;
    });
    const deviceData = Object.entries(deviceUsage).map(([name, value]) => ({ name, value }));

    return {
      cards: {
        scans,
        reviewsGenerated: generated,
        googleVisits: visits,
        conversionRate,
        completionRate,
        averageRatingSelected: avgRating,
        mostActiveDay: 'Friday', // simplified
      },
      dailyChart: Object.values(dailyDataMap),
      languageData,
      deviceData,
    };
  }
}

export const mockDb = new MockDatabase();
