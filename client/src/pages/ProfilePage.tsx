import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { Notification } from '../components/Notification';
import { getProfile, updateProfile } from '../services/profile';
import type { ProfileResponse, ProfileUpdateInput } from '../types/domain';

interface ProfileFormState {
  name: string;
  email: string;
  interests: string;
  currentSkills: string;
  experience: string;
  learningPreferences: string;
}

type ProfileField = keyof ProfileFormState;
type ProfileErrors = Partial<Record<ProfileField | 'form', string>>;

function toFormState(response: ProfileResponse): ProfileFormState {
  return {
    name: response.user.name,
    email: response.user.email,
    interests: response.profile.interests.join(', '),
    currentSkills: response.profile.currentSkills.join(', '),
    experience: response.profile.experience,
    learningPreferences: JSON.stringify(response.profile.learningPreferences, null, 2),
  };
}

function toList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateForm(form: ProfileFormState): {
  errors: ProfileErrors;
  payload?: ProfileUpdateInput;
} {
  const errors: ProfileErrors = {};
  const name = form.name.trim();
  const experience = form.experience.trim();
  const interests = toList(form.interests);
  const currentSkills = toList(form.currentSkills);

  if (!name) errors.name = 'Enter your name.';
  else if (name.length > 120) errors.name = 'Name must be 120 characters or fewer.';

  if (interests.length > 50) errors.interests = 'Add no more than 50 interests.';
  if (currentSkills.length > 100) errors.currentSkills = 'Add no more than 100 skills.';
  if (experience.length > 2000) errors.experience = 'Experience must be 2,000 characters or fewer.';

  let learningPreferences: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(form.learningPreferences || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      errors.learningPreferences = 'Learning preferences must be a JSON object.';
    } else {
      learningPreferences = parsed as Record<string, unknown>;
    }
  } catch {
    errors.learningPreferences = 'Enter valid JSON, for example { "pace": "steady" }.';
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    payload: {
      name,
      interests,
      currentSkills,
      experience,
      learningPreferences,
    },
  };
}

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    getProfile()
      .then((response) => {
        if (!active) return;
        setProfile(response);
        setForm(toFormState(response));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'We could not load your profile.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => loadProfile(), [loadProfile]);

  const updateField = (field: ProfileField, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    setSaveError(null);
    setSuccessMessage(null);
  };

  const handleReset = () => {
    if (!profile) return;
    setForm(toFormState(profile));
    setErrors({});
    setSaveError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    const result = validateForm(form);
    setErrors(result.errors);
    setSaveError(null);
    setSuccessMessage(null);
    if (!result.payload) return;

    setIsSaving(true);
    try {
      const response = await updateProfile(result.payload);
      setProfile(response);
      setForm(toFormState(response));
      setSuccessMessage('Your profile has been updated.');
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : 'We could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="profile-page page-container">
      <div className="profile-page__intro">
        <p className="eyebrow">Your Pathfinder profile</p>
        <h1>
          Make the journey <em>yours.</em>
        </h1>
        <p>
          Keep your interests, current skills, experience, and learning preferences up to date so
          your recommendations stay relevant.
        </p>
      </div>

      {isLoading && (
        <LoadingState
          label="Loading your profile"
          description="Gathering the details that shape your career journey."
        />
      )}

      {!isLoading && loadError && (
        <ErrorState
          title="We could not load your profile"
          description={loadError}
          actionLabel="Try again"
          onAction={loadProfile}
        />
      )}

      {!isLoading && !loadError && form && (
        <div className="profile-page__grid">
          <Card
            className="profile-page__account-card"
            title="Account details"
            description="Your sign-in identity is managed separately from your career profile."
          >
            <div className="profile-page__account-summary">
              <span className="profile-page__avatar" aria-hidden="true">
                {form.name.slice(0, 1).toUpperCase() || '?'}
              </span>
              <div>
                <strong>{form.name}</strong>
                <span>{form.email}</span>
              </div>
            </div>
            <p className="profile-page__account-note">
              Your email address cannot be edited from this page.
            </p>
          </Card>

          <Card
            className="profile-page__form-card"
            title="Career profile"
            description="These details help Pathfinder personalize your recommendations."
          >
            {successMessage && (
              <Notification
                tone="success"
                title="Profile saved"
                onDismiss={() => setSuccessMessage(null)}
              >
                {successMessage}
              </Notification>
            )}
            {saveError && (
              <Notification
                tone="error"
                title="Could not save changes"
                onDismiss={() => setSaveError(null)}
              >
                {saveError}
              </Notification>
            )}

            <form className="profile-form" onSubmit={handleSubmit} noValidate>
              <Input
                id="profile-name"
                label="Full name"
                name="name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                error={errors.name}
                autoComplete="name"
              />
              <Input
                id="profile-email"
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                readOnly
                hint="This is the email connected to your Pathfinder account."
                autoComplete="email"
              />
              <Input
                id="profile-interests"
                label="Interests"
                name="interests"
                value={form.interests}
                onChange={(event) => updateField('interests', event.target.value)}
                error={errors.interests}
                hint="Separate interests with commas, for example design, research, or teaching."
              />
              <Input
                id="profile-skills"
                label="Current skills"
                name="currentSkills"
                value={form.currentSkills}
                onChange={(event) => updateField('currentSkills', event.target.value)}
                error={errors.currentSkills}
                hint="Separate skills with commas, for example Python, writing, or teamwork."
              />
              <div className="profile-form__field">
                <label className="ui-field__label" htmlFor="profile-experience">
                  Experience
                </label>
                <textarea
                  id="profile-experience"
                  className={`profile-form__textarea ${errors.experience ? 'profile-form__textarea--error' : ''}`.trim()}
                  name="experience"
                  value={form.experience}
                  onChange={(event) => updateField('experience', event.target.value)}
                  aria-invalid={errors.experience ? true : undefined}
                  aria-describedby="profile-experience-hint profile-experience-error"
                  rows={5}
                />
                <p className="ui-field__hint" id="profile-experience-hint">
                  Share your background, projects, or experience level in a few sentences.
                </p>
                {errors.experience && (
                  <p className="ui-field__error" id="profile-experience-error" role="alert">
                    {errors.experience}
                  </p>
                )}
              </div>
              <div className="profile-form__field">
                <label className="ui-field__label" htmlFor="profile-preferences">
                  Learning preferences
                </label>
                <textarea
                  id="profile-preferences"
                  className={`profile-form__textarea profile-form__textarea--code ${errors.learningPreferences ? 'profile-form__textarea--error' : ''}`.trim()}
                  name="learningPreferences"
                  value={form.learningPreferences}
                  onChange={(event) => updateField('learningPreferences', event.target.value)}
                  aria-invalid={errors.learningPreferences ? true : undefined}
                  aria-describedby="profile-preferences-hint profile-preferences-error"
                  rows={6}
                  spellCheck={false}
                />
                <p className="ui-field__hint" id="profile-preferences-hint">
                  Store preferences as JSON, for example {`{ "pace": "steady" }`}.
                </p>
                {errors.learningPreferences && (
                  <p className="ui-field__error" id="profile-preferences-error" role="alert">
                    {errors.learningPreferences}
                  </p>
                )}
              </div>
              {errors.form && (
                <p className="ui-field__error" role="alert">
                  {errors.form}
                </p>
              )}
              <div className="profile-form__actions">
                <Button type="button" variant="ghost" onClick={handleReset} disabled={isSaving}>
                  Reset changes
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving changes…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}
