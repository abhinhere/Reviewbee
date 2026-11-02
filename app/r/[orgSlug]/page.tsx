'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { mockDb, isSupabaseConfigured, supabase } from '@/lib/db';

type Params = Promise<{ orgSlug: string }>;

export default function OrgReviewRedirect({ params }: { params: Params }) {
  const router = useRouter();
  const { orgSlug } = use(params);

  useEffect(() => {
    const resolveOrg = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('id, slug')
            .eq('slug', orgSlug)
            .maybeSingle();

          if (org) {
            const { data: branches } = await supabase
              .from('branches')
              .select('slug')
              .eq('organization_id', org.id);

            if (branches && branches.length > 0) {
              const mainBranch = branches.find((b) => b.slug === 'main') || branches[0];
              router.replace(`/r/${orgSlug}/${mainBranch.slug}`);
              return;
            }
          }
        } catch (e) {
          console.warn('Error resolving org from Supabase:', e);
        }
      }

      // Fallback
      const org = mockDb.getOrganizationBySlug(orgSlug);
      if (org) {
        const branches = mockDb.getBranches(org.id);
        const mainBranch = branches.find((b) => b.slug === 'main') || branches[0];
        if (mainBranch) {
          router.replace(`/r/${orgSlug}/${mainBranch.slug}`);
          return;
        }
      }
      router.replace('/');
    };

    resolveOrg();
  }, [orgSlug, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-xs text-slate-400 font-medium">Locating business review page...</p>
    </div>
  );
}
