import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { Notification } from '../components/Notification';
import { getProfile, updateProfile } from '../services/profile';
import {
  deleteAccount,
  exportAccountData,
  getPrivacyConsent,
  updatePrivacyConsent,
} from '../services/privacy';
import { clearAuthSession } from '../services/auth';
import type {
  EducationStage,
  PrivacyConsent,
  ProfileResponse,
  ProfileUpdateInput,
} from '../types/domain';

interface ProfileFormState {
  name: string;
  email: string;
  interests: string;
  currentSkills: string;
  experience: string;
  learningPreferences: string;
  goals: string;
  constraints: string;
  preferredWorkConditions: string;
  educationStage: string;
  locationPreference: string;
  weeklyTimeBudgetMinutes: string;
}

type ProfileField = keyof ProfileFormState;
type ProfileErrors = Partial<Record<ProfileField | 'form', string>>;

type RadioOption = {
  value: string;
  label: string;

  apiValue?: string;
  description: string;
};

const interestOptions: RadioOption[] = [
  {
    value: 'AI and machine learning',
    label: 'AI & machine learning',
    description: 'Build intelligent tools and models.',
  },
  {
    value: 'Data and analytics',
    label: 'Data & analytics',
    description: 'Find patterns and explain evidence.',
  },
  {
    value: 'Software and web development',
    label: 'Software development',
    description: 'Create apps, services, and digital products.',
  },
  {
    value: 'Cybersecurity and privacy',
    label: 'Cybersecurity',
    description: 'Protect systems, people, and information.',
  },
  {
    value: 'Product and business',
    label: 'Product & business',
    description: 'Shape strategy, products, and outcomes.',
  },
  {
    value: 'Design and user experience',
    label: 'Design & UX',
    description: 'Make useful, accessible experiences.',
  },
  {
    value: 'Research and education',
    label: 'Research & education',
    description: 'Learn deeply and help others learn.',
  },
  {
    value: 'Communication and media',
    label: 'Communication & media',
    description: 'Tell stories and connect audiences.',
  },
];

const skillOptions: RadioOption[] = [
  {
    value: 'Programming and Python',
    label: 'Programming & Python',
    description: 'You can write or understand code.',
  },
  {
    value: 'Data analysis and spreadsheets',
    label: 'Data analysis',
    description: 'You work with tables, metrics, or reports.',
  },
  {
    value: 'Machine learning and AI',
    label: 'Machine learning & AI',
    description: 'You have explored models or intelligent systems.',
  },
  {
    value: 'Writing and presentation',
    label: 'Writing & presentation',
    description: 'You communicate ideas clearly.',
  },
  {
    value: 'Research and problem solving',
    label: 'Research & problem solving',
    description: 'You investigate questions and find solutions.',
  },
  {
    value: 'Design and creative tools',
    label: 'Design & creative tools',
    description: 'You use visual or creative software.',
  },
  {
    value: 'Collaboration and leadership',
    label: 'Collaboration & leadership',
    description: 'You organize work and support a team.',
  },
  {
    value: 'Starting from the basics',
    label: 'Starting from the basics',
    description: 'You are building your first professional skills.',
  },
];

const goalOptions: RadioOption[] = [
  {
    value: 'Explore career options',
    label: 'Explore career options',
    description: 'Understand which paths fit me.',
  },
  {
    value: 'Build a portfolio',
    label: 'Build a portfolio',
    description: 'Create projects that show my ability.',
  },
  {
    value: 'Land my first role',
    label: 'Land my first role',
    description: 'Prepare for an entry-level opportunity.',
  },
  {
    value: 'Change careers',
    label: 'Change careers',
    description: 'Move into a new professional direction.',
  },
  {
    value: 'Upskill in my current role',
    label: 'Upskill in my current role',
    description: 'Become stronger in the work I already do.',
  },
  {
    value: 'Prepare for interviews',
    label: 'Prepare for interviews',
    description: 'Build confidence for applications and interviews.',
  },
  {
    value: 'Freelance or work independently',
    label: 'Freelance independently',
    description: 'Develop skills for flexible client work.',
  },
  {
    value: 'Pursue advanced study',
    label: 'Pursue advanced study',
    description: 'Prepare for deeper academic learning.',
  },
];

const constraintOptions: RadioOption[] = [
  {
    value: 'Limited weekly time',
    label: 'Limited weekly time',
    description: 'I need a compact, realistic plan.',
  },
  {
    value: 'Budget-conscious resources',
    label: 'Budget-conscious resources',
    description: 'Prefer free or low-cost learning.',
  },
  {
    value: 'Need remote access',
    label: 'Need remote access',
    description: 'My learning must work from home.',
  },
  {
    value: 'Accessibility needs',
    label: 'Accessibility needs',
    description: 'I need accessible formats or pacing.',
  },
  {
    value: 'Limited prior experience',
    label: 'Limited prior experience',
    description: 'I need a beginner-friendly starting point.',
  },
  {
    value: 'Balancing work, study, or caregiving',
    label: 'Balancing other commitments',
    description: 'My schedule changes around responsibilities.',
  },
  {
    value: 'Inconsistent schedule',
    label: 'Inconsistent schedule',
    description: 'I need flexible checkpoints and catch-up time.',
  },
  {
    value: 'No major constraints',
    label: 'No major constraints',
    description: 'I can follow a typical learning plan.',
  },
];

const workConditionOptions: RadioOption[] = [
  {
    value: 'Remote-first',
    label: 'Remote-first',
    description: 'I prefer working primarily online.',
  },
  { value: 'Hybrid', label: 'Hybrid', description: 'I like a mix of remote and in-person work.' },
  { value: 'On-site', label: 'On-site', description: 'I prefer a shared physical workplace.' },
  {
    value: 'Flexible schedule',
    label: 'Flexible schedule',
    description: 'I value control over when I work.',
  },
  {
    value: 'Structured routine',
    label: 'Structured routine',
    description: 'Clear hours and expectations help me.',
  },
  {
    value: 'Collaborative team',
    label: 'Collaborative team',
    description: 'I do my best work with regular teamwork.',
  },
  {
    value: 'Independent focus',
    label: 'Independent focus',
    description: 'I prefer long periods of focused work.',
  },
  {
    value: 'Mission-driven environment',
    label: 'Mission-driven environment',
    description: 'Purpose and impact matter most to me.',
  },
];

const experienceOptions: RadioOption[] = [
  {
    value: 'No formal experience yet',
    label: 'No formal experience yet',
    description: 'I am starting without professional experience.',
  },
  {
    value: 'Exploring as a student',
    label: 'Exploring as a student',
    description: 'I am learning and testing possible directions.',
  },
  {
    value: 'Coursework or certification',
    label: 'Coursework or certification',
    description: 'I have completed structured learning.',
  },
  {
    value: 'Personal projects',
    label: 'Personal projects',
    description: 'I have practiced through self-directed work.',
  },
  {
    value: 'Internship or apprenticeship',
    label: 'Internship or apprenticeship',
    description: 'I have had supervised practical exposure.',
  },
  {
    value: '0–2 years of experience',
    label: '0–2 years',
    description: 'I am early in my professional journey.',
  },
  {
    value: '3–5 years of experience',
    label: '3–5 years',
    description: 'I have several years of relevant experience.',
  },
  {
    value: '5+ years of experience',
    label: '5+ years',
    description: 'I bring substantial professional experience.',
  },
];

const educationOptions: RadioOption[] = [
  { value: '', label: 'Prefer not to say', description: 'Keep this optional context private.' },
  { value: 'secondary', label: 'Secondary education', description: 'High school or equivalent.' },
  {
    value: 'other',
    label: 'Vocational, self-taught, or other',
    description: 'A career-focused or alternative learning path.',
  },
  {
    value: 'vocational',
    label: 'Vocational or trade',
    description: 'Career-focused technical training.',
  },
  {
    value: 'undergraduate',
    label: 'Undergraduate',
    description: 'Currently studying or completed a degree.',
  },
  { value: 'graduate', label: 'Graduate', description: 'Postgraduate study or degree.' },
  {
    value: 'career-changer',
    label: 'Career changer',
    description: 'Moving from another professional field.',
  },
  {
    value: 'working-professional',
    label: 'Working professional',
    description: 'Currently established in a career.',
  },

  {
    value: 'self-taught-or-other',
    apiValue: 'other',
    label: 'Self-taught or other',
    description: 'A different learning path.',
  },
];

const locationOptions: RadioOption[] = [
  {
    value: 'Remote-first or anywhere',
    label: 'Remote-first / anywhere',
    description: 'Location flexibility is important.',
  },
  {
    value: 'Hybrid near home',
    label: 'Hybrid near home',
    description: 'Prefer a mix close to where I live.',
  },
  {
    value: 'On-site locally',
    label: 'On-site locally',
    description: 'Prefer opportunities in my local area.',
  },
  {
    value: 'Willing to relocate',
    label: 'Willing to relocate',
    description: 'Open to moving for the right path.',
  },
  {
    value: 'Global and asynchronous',
    label: 'Global / asynchronous',
    description: 'Time-zone flexibility works well for me.',
  },
  {
    value: 'Prefer the same time zone',
    label: 'Same time zone',
    description: 'Prefer work aligned with my local hours.',
  },
  {
    value: 'Specific region needed',
    label: 'Specific region needed',
    description: 'I need guidance for a particular region.',
  },
  {
    value: 'Prefer not to say',
    label: 'Prefer not to say',
    description: 'Keep location context private.',
  },
];

const timeBudgetOptions: RadioOption[] = [
  { value: '30', label: '30 minutes', description: 'A small daily or weekly commitment.' },
  { value: '60', label: '1 hour', description: 'A light, consistent learning block.' },
  { value: '120', label: '2 hours', description: 'A focused short plan.' },
  { value: '180', label: '3 hours', description: 'Several manageable sessions.' },
  { value: '300', label: '5 hours', description: 'A steady weekly routine.' },
  { value: '420', label: '7 hours', description: 'About one hour per day.' },
  { value: '600', label: '10 hours', description: 'A substantial weekly plan.' },
  { value: '900', label: '15 hours', description: 'An intensive learning schedule.' },
];

const learningPreferenceOptions: RadioOption[] = [
  {
    value: 'Video lessons',
    label: 'Video lessons',
    description: 'Learn through demonstrations and talks.',
  },
  {
    value: 'Reading and documentation',
    label: 'Reading & documentation',
    description: 'Prefer guides, books, and reference material.',
  },
  {
    value: 'Interactive exercises',
    label: 'Interactive exercises',
    description: 'Learn by answering and practicing.',
  },
  {
    value: 'Project-based learning',
    label: 'Project-based learning',
    description: 'Build something real from the start.',
  },
  {
    value: 'Instructor-led sessions',
    label: 'Instructor-led sessions',
    description: 'Prefer live or guided teaching.',
  },
  {
    value: 'Peer and community learning',
    label: 'Peer & community learning',
    description: 'Learn with feedback from others.',
  },
  {
    value: 'Short daily sessions',
    label: 'Short daily sessions',
    description: 'Prefer small, frequent learning blocks.',
  },
  {
    value: 'Flexible self-paced learning',
    label: 'Flexible self-paced',
    description: 'Choose my own timing and sequence.',
  },
];

function selectedListValue(value: string): string {
  return toList(value)[0] ?? '';
}

function learningPreferenceStyle(value: string): string {
  try {
    const parsed: unknown = JSON.parse(value || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const style = (parsed as Record<string, unknown>).style;
      return typeof style === 'string' ? style : '';
    }
  } catch {
    return '';
  }
  return '';
}

function updateLearningPreferenceStyle(value: string, style: string): string {
  let preferences: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(value || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      preferences = parsed as Record<string, unknown>;
    }
  } catch {
    preferences = {};
  }
  return JSON.stringify({ ...preferences, style }, null, 2);
}

function RadioChoiceGroup({
  id,
  label,
  name,
  value,
  options,
  hint,
  error,
  onChange,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  options: RadioOption[];
  hint: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedValue = value === '' ? '' : selectedListValue(value);
  const selectedOption = options.find((option) => {
    const submittedValue = option.apiValue ?? option.value;
    return selectedValue === option.value || submittedValue === selectedValue;
  });

  return (
    <details
      className={`profile-choice-group ${error ? 'profile-choice-group--error' : ''}`.trim()}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="profile-choice-group__summary">
        <span className="profile-choice-group__summary-copy">
          <strong>{label}</strong>
          <small>{selectedOption?.label ?? 'Choose an option'}</small>
        </span>
        <span className="profile-choice-group__chevron" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </summary>
      {isOpen && (
        <>
          <p className="profile-choice-group__hint" id={`${id}-hint`}>
            {hint}
          </p>
          <div
            className="profile-choice-grid"
            id={`${id}-options`}
            role="radiogroup"
            aria-label={label}
          >
            {options.map((option) => {
              const isCanonicalApiValue = !option.apiValue || option.apiValue === option.value;
              const isSelected =
                selectedValue === option.value ||
                (isCanonicalApiValue && selectedValue === (option.apiValue ?? option.value));
              const submittedValue = option.apiValue ?? option.value;

              return (
                <label
                  className={`profile-choice ${isSelected ? 'profile-choice--selected' : ''}`.trim()}
                  key={option.value}
                >
                  <input
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => {
                      onChange(submittedValue);
                      setIsOpen(false);
                    }}
                  />
                  <span className="profile-choice__copy">
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}
      {error && (
        <p className="ui-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </details>
  );
}

function toFormState(response: ProfileResponse): ProfileFormState {
  return {
    name: response.user.name,
    email: response.user.email,
    interests: response.profile.interests.join(', '),
    currentSkills: response.profile.currentSkills.join(', '),
    experience: response.profile.experience,
    learningPreferences: JSON.stringify(response.profile.learningPreferences, null, 2),
    goals: response.profile.goals.join(', '),
    constraints: response.profile.constraints.join(', '),
    preferredWorkConditions: response.profile.preferredWorkConditions.join(', '),
    educationStage: response.profile.educationStage ?? '',
    locationPreference: response.profile.locationPreference ?? '',
    weeklyTimeBudgetMinutes: response.profile.weeklyTimeBudgetMinutes?.toString() ?? '',
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

  const goals = toList(form.goals);
  const constraints = toList(form.constraints);
  const preferredWorkConditions = toList(form.preferredWorkConditions);
  const locationPreference = form.locationPreference.trim();
  const weeklyTimeBudgetMinutes = form.weeklyTimeBudgetMinutes.trim();

  if (interests.length > 50) errors.interests = 'Add no more than 50 interests.';
  if (currentSkills.length > 100) errors.currentSkills = 'Add no more than 100 skills.';
  if (goals.length > 20) errors.goals = 'Add no more than 20 goals.';
  if (constraints.length > 20) errors.constraints = 'Add no more than 20 constraints.';
  if (preferredWorkConditions.length > 20)
    errors.preferredWorkConditions = 'Add no more than 20 work conditions.';
  if (experience.length > 2000) errors.experience = 'Experience must be 2,000 characters or fewer.';
  if (locationPreference.length > 200)
    errors.locationPreference = 'Location preference must be 200 characters or fewer.';

  const educationStages = new Set([
    '',
    'secondary',
    'undergraduate',
    'graduate',
    'career-changer',
    'working-professional',
    'other',
  ]);
  if (!educationStages.has(form.educationStage))
    errors.educationStage = 'Choose a supported education stage.';

  let timeBudget: number | null = null;
  if (weeklyTimeBudgetMinutes) {
    timeBudget = Number(weeklyTimeBudgetMinutes);
    if (!Number.isInteger(timeBudget) || timeBudget < 30 || timeBudget > 10080) {
      errors.weeklyTimeBudgetMinutes = 'Enter a whole number from 30 to 10,080 minutes.';
    }
  }

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
      goals,
      constraints,
      preferredWorkConditions,
      educationStage: (form.educationStage || null) as EducationStage | null,
      locationPreference: locationPreference || null,
      weeklyTimeBudgetMinutes: timeBudget,
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
  const [privacyConsent, setPrivacyConsent] = useState<PrivacyConsent | null>(null);
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    let active = true;
    getPrivacyConsent()
      .then((consent) => {
        if (active) setPrivacyConsent(consent);
      })
      .catch((error: unknown) => {
        if (active)
          setPrivacyError(
            error instanceof Error ? error.message : 'We could not load your privacy choices.',
          );
      });
    return () => {
      active = false;
    };
  }, []);

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

  const togglePrivacyConsent = (
    field: keyof Pick<PrivacyConsent, 'analytics' | 'personalizedAi' | 'vrTelemetry'>,
  ) => {
    setPrivacyConsent((current) => (current ? { ...current, [field]: !current[field] } : current));
    setPrivacyError(null);
    setPrivacyMessage(null);
  };

  const handleSavePrivacy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!privacyConsent) return;
    setIsSavingPrivacy(true);
    setPrivacyError(null);
    setPrivacyMessage(null);
    try {
      const consent = await updatePrivacyConsent(privacyConsent);
      setPrivacyConsent(consent);
      setPrivacyMessage('Your privacy choices have been saved.');
    } catch (error: unknown) {
      setPrivacyError(
        error instanceof Error ? error.message : 'We could not save your privacy choices.',
      );
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setPrivacyError(null);
    try {
      const blob = await exportAccountData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pathfinder-account-export.json';
      link.click();
      URL.revokeObjectURL(url);
      setPrivacyMessage('Your account export has been downloaded.');
    } catch (error: unknown) {
      setPrivacyError(
        error instanceof Error ? error.message : 'We could not export your account data.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm('Delete your Pathfinder account and all saved data? This cannot be undone.')
    )
      return;
    setIsDeleting(true);
    setPrivacyError(null);
    try {
      await deleteAccount();
      clearAuthSession();
      window.location.assign('/login?reason=account-deleted');
    } catch (error: unknown) {
      setPrivacyError(error instanceof Error ? error.message : 'We could not delete your account.');
      setIsDeleting(false);
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
          your recommendations stay relevant. Optional learner context can help future guidance
          respect your goals, constraints, and available time.
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
            className="profile-page__privacy-card"
            title="Privacy and account data"
            description="Choose what optional data Pathfinder may use and manage your saved account data."
          >
            {privacyError && (
              <Notification
                tone="error"
                title="Privacy action failed"
                onDismiss={() => setPrivacyError(null)}
              >
                {privacyError}
              </Notification>
            )}
            {privacyMessage && (
              <Notification
                tone="success"
                title="Privacy settings updated"
                onDismiss={() => setPrivacyMessage(null)}
              >
                {privacyMessage}
              </Notification>
            )}
            {privacyConsent ? (
              <form className="profile-privacy" onSubmit={handleSavePrivacy}>
                <p className="profile-page__account-note">
                  Optional choices are off by default. Core career, skill-gap, and roadmap features
                  remain available.
                </p>
                <label className="profile-privacy__choice">
                  <input
                    type="checkbox"
                    checked={privacyConsent.personalizedAi}
                    onChange={() => togglePrivacyConsent('personalizedAi')}
                  />
                  <span>
                    <strong>Personalized advisor context</strong>
                    <small>
                      Allow saved profile, assessment, and roadmap context to personalize advisor
                      answers.
                    </small>
                  </span>
                </label>
                <label className="profile-privacy__choice">
                  <input
                    type="checkbox"
                    checked={privacyConsent.analytics}
                    onChange={() => togglePrivacyConsent('analytics')}
                  />
                  <span>
                    <strong>Product analytics</strong>
                    <small>Allow privacy-safe usage events to help improve the experience.</small>
                  </span>
                </label>
                <label className="profile-privacy__choice">
                  <input
                    type="checkbox"
                    checked={privacyConsent.vrTelemetry}
                    onChange={() => togglePrivacyConsent('vrTelemetry')}
                  />
                  <span>
                    <strong>VR telemetry</strong>
                    <small>
                      Allow coarse VR engagement events; raw movement and biometric data are never
                      requested.
                    </small>
                  </span>
                </label>
                <div className="profile-form__actions">
                  <Button type="submit" disabled={isSavingPrivacy}>
                    {isSavingPrivacy ? 'Saving privacy choices…' : 'Save privacy choices'}
                  </Button>
                </div>
              </form>
            ) : (
              <LoadingState
                label="Loading privacy choices"
                description="Preparing your account controls."
              />
            )}
            <div className="profile-privacy__actions">
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={isExporting || isDeleting}
              >
                {isExporting ? 'Preparing export…' : 'Download my data'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting || isExporting}
              >
                {isDeleting ? 'Deleting account…' : 'Delete account'}
              </Button>
            </div>
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
                required
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
              <RadioChoiceGroup
                id="profile-interests"
                label="Primary interest"
                name="profile-interest"
                value={form.interests}
                options={interestOptions}
                hint="Choose the career domain you are most curious about right now."
                error={errors.interests}
                onChange={(value) => updateField('interests', value)}
              />
              <RadioChoiceGroup
                id="profile-skills"
                label="Strongest current skill area"
                name="profile-skill"
                value={form.currentSkills}
                options={skillOptions}
                hint="Choose the skill area that best describes your current starting point."
                error={errors.currentSkills}
                onChange={(value) => updateField('currentSkills', value)}
              />
              <RadioChoiceGroup
                id="profile-goals"
                label="Learner goal"
                name="profile-goal"
                value={form.goals}
                options={goalOptions}
                hint="Choose the outcome you want Pathfinder to prioritize."
                error={errors.goals}
                onChange={(value) => updateField('goals', value)}
              />
              <RadioChoiceGroup
                id="profile-constraints"
                label="Biggest constraint"
                name="profile-constraint"
                value={form.constraints}
                options={constraintOptions}
                hint="Choose the factor that Pathfinder should respect when shaping guidance."
                error={errors.constraints}
                onChange={(value) => updateField('constraints', value)}
              />
              <RadioChoiceGroup
                id="profile-work-conditions"
                label="Preferred work conditions"
                name="profile-work-condition"
                value={form.preferredWorkConditions}
                options={workConditionOptions}
                hint="Choose the environment in which you expect to do your best work."
                error={errors.preferredWorkConditions}
                onChange={(value) => updateField('preferredWorkConditions', value)}
              />
              <RadioChoiceGroup
                id="profile-experience"
                label="Experience level"
                name="profile-experience"
                value={form.experience}
                options={experienceOptions}
                hint="Choose the description that best matches your current experience."
                error={errors.experience}
                onChange={(value) => updateField('experience', value)}
              />
              <RadioChoiceGroup
                id="profile-education-stage"
                label="Education or career stage"
                name="profile-education-stage"
                value={form.educationStage}
                options={educationOptions}
                hint="This optional context supports relevant explanations; it is not a qualification assessment."
                error={errors.educationStage}
                onChange={(value) => updateField('educationStage', value)}
              />
              <RadioChoiceGroup
                id="profile-location"
                label="Location preference"
                name="profile-location"
                value={form.locationPreference}
                options={locationOptions}
                hint="Choose the location pattern that best fits your career search."
                error={errors.locationPreference}
                onChange={(value) => updateField('locationPreference', value)}
              />
              <RadioChoiceGroup
                id="profile-time-budget"
                label="Weekly learning time"
                name="profile-time-budget"
                value={form.weeklyTimeBudgetMinutes}
                options={timeBudgetOptions}
                hint="Choose a realistic weekly learning budget so future roadmaps can respect your time."
                error={errors.weeklyTimeBudgetMinutes}
                onChange={(value) => updateField('weeklyTimeBudgetMinutes', value)}
              />
              <RadioChoiceGroup
                id="profile-preferences"
                label="Learning preferences"
                name="profile-learning-preference"
                value={learningPreferenceStyle(form.learningPreferences)}
                options={learningPreferenceOptions}
                hint="Choose the learning style Pathfinder should prioritize in future guidance."
                error={errors.learningPreferences}
                onChange={(value) =>
                  updateField(
                    'learningPreferences',
                    updateLearningPreferenceStyle(form.learningPreferences, value),
                  )
                }
              />
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
