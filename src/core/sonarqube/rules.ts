import type { HotspotDetail, IssueChangelogEntry, RuleDetail, SonarQubeConnection } from '../types';
import { logger } from '../logger';
import { apiRequest } from './client';

function orgParam(conn: SonarQubeConnection): Record<string, string | undefined> {
  return conn.organization ? { organization: conn.organization } : {};
}

/** Full rule definition incl. "why" and "how to fix" guidance (HTML, sanitized in the UI). */
export async function getRule(conn: SonarQubeConnection, key: string): Promise<RuleDetail | null> {
  try {
    const data = await apiRequest<{
      rule: {
        key: string;
        name: string;
        severity?: string;
        type?: string;
        lang?: string;
        langName?: string;
        tags?: string[];
        sysTags?: string[];
        htmlDesc?: string;
        descriptionSections?: Array<{ key: string; content: string }>;
        remFnBaseEffort?: string;
      };
    }>(conn, '/api/rules/show', { key, ...orgParam(conn) });

    const r = data.rule;
    return {
      key: r.key,
      name: r.name,
      ...(r.severity && { severity: r.severity }),
      ...(r.type && { type: r.type }),
      ...(r.langName || r.lang ? { language: r.langName ?? r.lang } : {}),
      tags: [...(r.tags ?? []), ...(r.sysTags ?? [])],
      descriptionSections: r.descriptionSections ?? [],
      ...(r.htmlDesc && { htmlDescription: r.htmlDesc }),
      ...(r.remFnBaseEffort && { remediationEffort: r.remFnBaseEffort }),
    };
  } catch (error) {
    logger.warn('Failed to fetch rule:', error instanceof Error ? error.message : error);
    return null;
  }
}

/** Full hotspot detail incl. risk + fix guidance and changelog. */
export async function getHotspotDetail(
  conn: SonarQubeConnection,
  hotspotKey: string,
): Promise<HotspotDetail | null> {
  try {
    const data = await apiRequest<{
      key: string;
      message: string;
      component?: { key: string };
      line?: number;
      status: string;
      resolution?: string;
      assignee?: string;
      creationDate?: string;
      textRange?: { startLine: number; endLine: number; startOffset: number; endOffset: number };
      rule?: {
        key?: string;
        securityCategory?: string;
        vulnerabilityProbability?: string;
        riskDescription?: string;
        vulnerabilityDescription?: string;
        fixRecommendations?: string;
      };
      changelog?: Array<{
        user?: string;
        userName?: string;
        creationDate?: string;
        diffs?: Array<{ key: string; oldValue?: string; newValue?: string }>;
      }>;
    }>(conn, '/api/hotspots/show', { hotspot: hotspotKey, ...orgParam(conn) });

    const changelog: IssueChangelogEntry[] = (data.changelog ?? []).map((c) => ({
      ...(c.userName || c.user ? { user: c.userName ?? c.user } : {}),
      ...(c.creationDate ? { creationDate: c.creationDate } : {}),
      diffs: c.diffs ?? [],
    }));

    return {
      key: data.key,
      message: data.message,
      component: data.component?.key ?? '',
      ...(data.line != null && { line: data.line }),
      status: data.status,
      ...(data.resolution && { resolution: data.resolution }),
      ...(data.rule?.securityCategory && { securityCategory: data.rule.securityCategory }),
      ...(data.rule?.vulnerabilityProbability && {
        vulnerabilityProbability: data.rule.vulnerabilityProbability,
      }),
      ...(data.rule?.key && { ruleKey: data.rule.key }),
      ...(data.assignee && { assignee: data.assignee }),
      ...(data.creationDate && { creationDate: data.creationDate }),
      ...(data.textRange && { textRange: data.textRange }),
      ...(data.rule?.riskDescription && { riskDescription: data.rule.riskDescription }),
      ...(data.rule?.vulnerabilityDescription && {
        vulnerabilityDescription: data.rule.vulnerabilityDescription,
      }),
      ...(data.rule?.fixRecommendations && { fixRecommendations: data.rule.fixRecommendations }),
      changelog,
    };
  } catch (error) {
    logger.warn('Failed to fetch hotspot detail:', error instanceof Error ? error.message : error);
    return null;
  }
}
