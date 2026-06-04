import type {
  ILinkedInCompanyExtract,
  ILinkedInJobExtract,
  ILinkedInPostExtract,
  ILinkedInProfileExtract,
} from "@linkai/types";
import { detectLinkedInPageType } from "./linkedin-detector";

function text(el: Element | null): string | undefined {
  const t = el?.textContent?.trim();
  return t && t.length > 0 ? t.slice(0, 5000) : undefined;
}

function sanitize(str?: string): string | undefined {
  if (!str) return undefined;
  return str.replace(/<[^>]*>/g, "").trim().slice(0, 2000);
}

export function extractProfileData(doc: Document = document): ILinkedInProfileExtract {
  const url = window.location.href;
  const name =
    text(doc.querySelector("h1")) ||
    text(doc.querySelector(".pv-text-details__left-panel h1"));
  const headline = text(doc.querySelector(".text-body-medium")) || text(doc.querySelector(".pv-top-card .mt2"));
  const location = text(doc.querySelector(".text-body-small.inline.t-black--light"));
  const about = text(doc.querySelector("#about ~ div .inline-show-more-text"));

  return {
    url,
    name: sanitize(name),
    headline: sanitize(headline),
    location: sanitize(location),
    about: sanitize(about),
    extractedAt: new Date().toISOString(),
  };
}

export function extractPostData(doc: Document = document): ILinkedInPostExtract {
  const article = doc.querySelector("article, .feed-shared-update-v2");
  const content = text(article?.querySelector(".feed-shared-text, .update-components-text") ?? null);
  const author = text(article?.querySelector(".update-components-actor__name, .feed-shared-actor__name") ?? null);

  return {
    url: window.location.href,
    author: sanitize(author),
    content: sanitize(content),
    extractedAt: new Date().toISOString(),
  };
}

export function extractJobData(doc: Document = document): ILinkedInJobExtract {
  const title =
    text(doc.querySelector(".job-details-jobs-unified-top-card__job-title, h1.t-24")) ||
    text(doc.querySelector("h1"));
  const company = text(doc.querySelector(".job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name"));
  const location = text(doc.querySelector(".job-details-jobs-unified-top-card__bullet, .jobs-unified-top-card__workplace-type"));

  return {
    url: window.location.href,
    title: sanitize(title),
    company: sanitize(company),
    location: sanitize(location),
    extractedAt: new Date().toISOString(),
  };
}

export function extractCompanyData(doc: Document = document): ILinkedInCompanyExtract {
  const name = text(doc.querySelector("h1.org-top-card-summary__title, h1"));
  const industry = text(doc.querySelector(".org-top-card-summary-info-list__info-item"));

  return {
    url: window.location.href,
    name: sanitize(name),
    industry: sanitize(industry),
    extractedAt: new Date().toISOString(),
  };
}

export function extractForCurrentPage(doc: Document = document): Record<string, unknown> {
  const pageType = detectLinkedInPageType(window.location.href);
  switch (pageType) {
    case "profile":
      return { pageType, data: extractProfileData(doc) };
    case "post":
    case "feed":
      return { pageType, data: extractPostData(doc) };
    case "job":
    case "jobs":
      return { pageType, data: extractJobData(doc) };
    case "company":
      return { pageType, data: extractCompanyData(doc) };
    default:
      return { pageType, url: window.location.href };
  }
}
