import uzCommon from "@/locales/uz/common.json";
import uzAuth from "@/locales/uz/auth.json";
import uzProfile from "@/locales/uz/profile.json";
import uzPost from "@/locales/uz/post.json";
import uzNotifications from "@/locales/uz/notifications.json";
import uzSettings from "@/locales/uz/settings.json";
import enCommon from "@/locales/en/common.json";
import enAuth from "@/locales/en/auth.json";
import enProfile from "@/locales/en/profile.json";
import enPost from "@/locales/en/post.json";
import enNotifications from "@/locales/en/notifications.json";
import enSettings from "@/locales/en/settings.json";
import ruCommon from "@/locales/ru/common.json";
import ruAuth from "@/locales/ru/auth.json";
import ruProfile from "@/locales/ru/profile.json";
import ruPost from "@/locales/ru/post.json";
import ruNotifications from "@/locales/ru/notifications.json";
import ruSettings from "@/locales/ru/settings.json";

export type Language = "uz" | "en" | "ru";
export type Namespace = "common" | "auth" | "profile" | "post" | "notifications" | "settings";

interface LocaleTree {
  [key: string]: string | LocaleTree;
}
type LocaleBundle = Record<Namespace, LocaleTree>;
type InterpolationValue = string | number | boolean | null | undefined;

export const languages: Record<Language, { nativeName: string; shortName: string; flag: string; locale: string }> = {
  uz: { nativeName: "O'zbekcha", shortName: "UZ", flag: "🇺🇿", locale: "uz-UZ" },
  en: { nativeName: "English", shortName: "EN", flag: "🇺🇸", locale: "en-US" },
  ru: { nativeName: "Русский", shortName: "RU", flag: "🇷🇺", locale: "ru-RU" },
};

export const defaultLanguage: Language = "uz";

const resources: Record<Language, LocaleBundle> = {
  uz: { common: uzCommon, auth: uzAuth, profile: uzProfile, post: uzPost, notifications: uzNotifications, settings: uzSettings },
  en: { common: enCommon, auth: enAuth, profile: enProfile, post: enPost, notifications: enNotifications, settings: enSettings },
  ru: { common: ruCommon, auth: ruAuth, profile: ruProfile, post: ruPost, notifications: ruNotifications, settings: ruSettings },
};

const legacyKeyMap: Record<string, string> = {
  home: "common.nav.home",
  askQuestion: "common.nav.askQuestion",
  askAI: "common.nav.askAI",
  settings: "common.nav.settings",
  profile: "common.nav.profile",
  logout: "auth.logout",
  login: "auth.login",
  register: "auth.register",
  search: "common.search.label",
  notifications: "common.nav.notifications",
  loading: "common.states.loading",
  error: "common.states.error",
  save: "common.actions.save",
  cancel: "common.actions.cancel",
  edit: "common.actions.edit",
  delete: "common.actions.delete",
  preview: "common.actions.preview",
  privacy: "settings.privacy.title",
  terms: "common.footer.terms",
  support: "common.footer.support",
  language: "settings.language.title",
  security: "settings.security.title",
  settingsTitle: "settings.title",
  settingsDesc: "settings.description",
  languageRegion: "settings.language.region",
  languageRegionDesc: "settings.language.description",
  notificationsPrivacy: "settings.notifications.title",
  notificationsPrivacyDesc: "settings.notifications.description",
  settingsSaved: "settings.saved",
  currentPassword: "settings.security.currentPassword",
  newPassword: "settings.security.newPassword",
  confirmPassword: "settings.security.confirmPassword",
  updatePassword: "settings.security.updatePassword",
  passwordChanged: "settings.security.passwordChanged",
  passwordMismatch: "settings.security.passwordMismatch",
  passwordTooShort: "settings.security.passwordTooShort",
  wrongPassword: "settings.security.wrongPassword",
  changeUsername: "settings.account.changeUsername",
  usernameRequired: "settings.account.usernameRequired",
  usernameChanged: "settings.account.usernameChanged",
  usernameChangeError: "settings.account.usernameChangeError",
  newUsername: "settings.account.newUsername",
  updateUsername: "settings.account.updateUsername",
  emailNotifications: "settings.notifications.email",
  emailNotificationsDesc: "settings.notifications.emailDescription",
  publicProfile: "settings.privacy.publicProfile",
  publicProfileDesc: "settings.privacy.publicProfileDescription",
  noQuestions: "post.empty.noQuestions",
  noQuestionsDesc: "post.empty.noQuestionsDescription",
  newest: "post.filters.newest",
  popular: "post.filters.popular",
  unanswered: "post.filters.unanswered",
  searchPlaceholder: "common.search.placeholder",
  askQuestionTitle: "post.composer.askQuestionTitle",
  postQuestion: "post.composer.postQuestion",
  posting: "post.composer.posting",
  titleLabel: "post.fields.title",
  titlePlaceholder: "post.fields.titlePlaceholder",
  detailsLabel: "post.fields.details",
  tagsLabel: "post.fields.tags",
  tagsPlaceholder: "post.fields.tagsPlaceholder",
  answers: "post.answers.title",
  noAnswers: "post.answers.empty",
  writeAnswer: "post.answers.placeholder",
  postAnswer: "post.answers.post",
  reply: "post.actions.reply",
  like: "post.actions.like",
  aiComment: "post.ai.comment",
  follow: "profile.actions.follow",
  unfollow: "profile.actions.unfollow",
  followers: "profile.stats.followers",
  following: "profile.stats.following",
  questions: "profile.tabs.posts",
  myAnswers: "profile.tabs.replies",
  liked: "profile.tabs.likes",
  editProfile: "profile.actions.editProfile",
  saveProfile: "profile.actions.saveProfile",
  university: "profile.fields.university",
  firstName: "profile.fields.firstName",
  lastName: "profile.fields.lastName",
  noQuestionsYet: "profile.empty.postsTitleOther",
  noAnswersYet: "profile.empty.repliesTitle",
  noLikedYet: "profile.empty.likesTitle",
  notificationsTitle: "notifications.title",
  loginDevices: "notifications.sessions.title",
  noNotifications: "notifications.empty",
  lastDevice: "notifications.sessions.lastDevice",
  currentDevice: "notifications.sessions.current",
  usernameOrEmail: "auth.usernameOrEmail",
  password: "auth.password",
  loginTitle: "auth.loginTitle",
  loginDesc: "auth.loginDescription",
  noAccount: "auth.noAccount",
  registerTitle: "auth.registerTitle",
  registerDesc: "auth.registerDescription",
  hasAccount: "auth.hasAccount",
  firstNameLabel: "auth.firstName",
  lastNameLabel: "auth.lastName",
  supportTitle: "common.support.title",
  supportDesc: "common.support.description",
};

function resolvePath(bundle: LocaleBundle, key: string) {
  const [namespace, ...parts] = key.split(".");
  let current: string | LocaleTree | undefined = bundle[namespace as Namespace];
  for (const part of parts) {
    if (!current || typeof current === "string") return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(value: string, variables: Record<string, InterpolationValue>) {
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => String(variables[name] ?? ""));
}

function pluralKey(lang: Language, key: string, count?: number) {
  if (typeof count !== "number") return key;
  if (lang === "ru") {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${key}_one`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${key}_few`;
    return `${key}_many`;
  }
  return count === 1 ? `${key}_one` : `${key}_other`;
}

export function isLanguage(value: unknown): value is Language {
  return value === "uz" || value === "en" || value === "ru";
}

export function t(lang: Language, key: string, variables: Record<string, InterpolationValue> = {}): string {
  const normalizedKey = legacyKeyMap[key] || key;
  const keyWithPlural = pluralKey(lang, normalizedKey, typeof variables.count === "number" ? Number(variables.count) : undefined);
  const value =
    resolvePath(resources[lang], keyWithPlural) ??
    resolvePath(resources[lang], normalizedKey) ??
    resolvePath(resources[defaultLanguage], keyWithPlural) ??
    resolvePath(resources[defaultLanguage], normalizedKey) ??
    normalizedKey;
  return interpolate(value, variables);
}

export function formatRelativeTime(lang: Language, dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (sec < 60) return t(lang, "common.time.now");
  if (min < 60) return t(lang, "common.time.minutesAgo", { count: min });
  if (hour < 24) return t(lang, "common.time.hoursAgo", { count: hour });
  if (day < 7) return t(lang, "common.time.daysAgo", { count: day });
  return new Date(dateStr).toLocaleDateString(languages[lang].locale);
}

export function formatMonthYear(lang: Language, date?: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(languages[lang].locale, { month: "long", year: "numeric" });
}
