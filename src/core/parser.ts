export const parseHtml = (html: string, _doc?: Document) => {
  try {
    _doc = new DOMParser().parseFromString(html, "text/html");
  } catch (_) {
    _doc = document.implementation.createHTMLDocument("");
    _doc.documentElement.innerHTML = html;
  }

  return _doc.body.childNodes;
};
