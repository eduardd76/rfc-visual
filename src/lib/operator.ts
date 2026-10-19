/**
 * The site operator, as required for the Impressum (§ 5 DDG) and the privacy
 * notice (Art. 13 GDPR). Until `name` is filled in, /impressum/ and /privacy/
 * render "not found" and the footer does not link them.
 */
export type Operator = {
  name: string;
  street: string;
  city: string;
  country: string;
  email: string;
  phone?: string;
};

export const OPERATOR: Operator | null = null;
