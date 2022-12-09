import { parseDocument, DomUtils } from "htmlparser2";

export const parseHtml = (str: string) => {
  const doc = parseDocument(str);
  const body = DomUtils.findOne((el) => el.name === "body", doc.childNodes);

  return (body || doc).childNodes;
};
