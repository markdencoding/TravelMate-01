'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from '@/lib/validators/profile';
import {
  dbProfileToUiUser,
  dbProfileToUiPreferences,
  uiProfileToDbUpdate,
} from '@/lib/mappers/profiles';
import { formatDatabaseError } from '@/lib/errors';
import type { DbProfileRow } from '@/lib/types/database';
import type { CurrentUser, UserPreferences } from '@/types';
import type { ActionResponse } from './trips';

/**
 * Server-side query: fetch current user profile and preferences.
 */
export async function getProfileAction(): Promise<{
  data: { user: CurrentUser; preferences: UserPreferences } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      return { data: null, error: formatDatabaseError(error, 'Profile not found.') };
    }

    const row = data as DbProfileRow;
    return {
      data: {
        user: dbProfileToUiUser(row),
        preferences: dbProfileToUiPreferences(row),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: formatDatabaseError(err) };
  }
}

/**
 * Server Action: Update current user profile preferences.
 * Trigger protects role and is_active from client alteration.
 */
export async function updateProfileAction(
  rawInput: ProfileUpdateInput
): Promise<ActionResponse<{ user: CurrentUser; preferences: UserPreferences }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: 'You must be signed in to update settings.' };
    }

    const validation = profileUpdateSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || 'Validation failed',
      };
    }

    const updatePayload = uiProfileToDbUpdate(validation.data);

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', authUser.id)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: formatDatabaseError(error, 'Failed to update profile settings.') };
    }

    revalidatePath('/settings');

    const row = data as DbProfileRow;
    return {
      success: true,
      data: {
        user: dbProfileToUiUser(row),
        preferences: dbProfileToUiPreferences(row),
      },
    };
  } catch (err) {
    return { success: false, error: formatDatabaseError(err) };
  }
}
