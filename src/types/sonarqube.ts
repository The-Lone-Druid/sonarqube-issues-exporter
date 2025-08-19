export interface SonarQubeIssue {
  key: string;
  rule: string;
  severity: IssueSeverity;
  component: string;
  project: string;
  line?: number;
  hash?: string;
  textRange?: TextRange;
  flows?: Flow[];
  status: IssueStatus;
  message: string;
  effort?: string;
  debt?: string;
  assignee?: string;
  author?: string;
  tags?: string[];
  transitions?: string[];
  actions?: string[];
  comments?: Comment[];
  creationDate: string;
  updateDate?: string;
  closeDate?: string;
  type: IssueType;
  scope?: IssueScope;
  quickFixAvailable?: boolean;
  messageFormattings?: MessageFormatting[];
}

export interface TextRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

export interface Flow {
  locations: Location[];
}

export interface Location {
  component: string;
  textRange: TextRange;
  msg: string;
  msgFormattings?: MessageFormatting[];
}

export interface Comment {
  key: string;
  login: string;
  htmlText: string;
  markdown: string;
  updatable: boolean;
  createdAt: string;
}

export interface MessageFormatting {
  start: number;
  end: number;
  type: 'CODE';
}

export type IssueSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
export type IssueStatus = 'OPEN' | 'CONFIRMED' | 'REOPENED' | 'RESOLVED' | 'CLOSED';
export type IssueType = 'BUG' | 'VULNERABILITY' | 'CODE_SMELL' | 'SECURITY_HOTSPOT';
export type IssueScope = 'MAIN' | 'TEST';

export interface SonarQubeSearchResponse {
  total: number;
  p: number;
  ps: number;
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  effortTotal?: number;
  debtTotal?: number;
  issues: SonarQubeIssue[];
  components: Component[];
  rules: Rule[];
  users: User[];
  languages: Language[];
  facets: Facet[];
}

export interface Component {
  key: string;
  enabled: boolean;
  qualifier: string;
  name: string;
  longName: string;
  path?: string;
}

export interface Rule {
  key: string;
  name: string;
  lang: string;
  langName: string;
  status: string;
}

export interface User {
  login: string;
  name: string;
  avatar?: string;
  active: boolean;
}

export interface Language {
  key: string;
  name: string;
}

export interface Facet {
  property: string;
  values: FacetValue[];
}

export interface FacetValue {
  val: string;
  count: number;
}
