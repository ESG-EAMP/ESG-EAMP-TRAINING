import React, { useEffect, useRef, useState } from 'react';
import ClassicEditor from 'ckeditor5-classic-plus';

/**
 * React wrapper for CKEditor 5 (ckeditor5-classic-plus) using the vanilla API.
 * Use this instead of @ckeditor/ckeditor5-react when the official React component
 * requires a newer CKEditor version (e.g. 42+) than your build (e.g. 41).
 *
 * Props:
 *   - data: initial HTML content
 *   - onChange: (event, editor, rawHtml?) => void — called when content changes.
 *     If rawHtml is provided (e.g. from "Edit HTML" Apply), use it to preserve classes/attributes.
 *   - config: CKEditor config (e.g. placeholder, simpleUpload)
 */
export default function CKEditorWrapper({ data = '', onChange, config = {} }) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [editorReady, setEditorReady] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [htmlSource, setHtmlSource] = useState('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let editorInstance = null;

    // Preserve classes, attributes, and styles when saving (General HTML Support).
    // If your build does not include GHS (e.g. CKEditor before v34), this is ignored.
    const defaultHtmlSupport = {
      htmlSupport: {
        allow: [
          { name: /.*/, classes: true, attributes: true, styles: true }
        ]
      }
    };
    const mergedConfig = { ...defaultHtmlSupport, ...config };

    ClassicEditor.create(el, mergedConfig)
      .then((editor) => {
        if (cancelled) {
          editor.destroy();
          return;
        }
        editorInstance = editor;
        editorRef.current = editor;
        editor.setData(data);
        editor.model.document.on('change:data', () => {
          if (onChangeRef.current) {
            onChangeRef.current(null, editor);
          }
        });
        setEditorReady(true);
      })
      .catch((err) => {
        if (!cancelled) console.error('CKEditor creation failed', err);
      });

    return () => {
      cancelled = true;
      setEditorReady(false);
      if (editorInstance) {
        editorInstance.destroy().catch(() => {});
        editorRef.current = null;
      }
    };
  }, []);

  const openHtmlModal = () => {
    if (editorRef.current) {
      setHtmlSource(editorRef.current.getData());
      setShowHtmlModal(true);
    }
  };

  const applyHtmlSource = () => {
    if (editorRef.current) {
      editorRef.current.setData(htmlSource);
      // Pass raw HTML as 3rd arg so parent can preserve classes (getData() strips them without GHS)
      if (onChangeRef.current) {
        onChangeRef.current(null, editorRef.current, htmlSource);
      }
      setShowHtmlModal(false);
    }
  };

  return (
    <div className="ckeditor-wrapper-with-html">
      {editorReady && (
        <div className="mb-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={openHtmlModal}
          >
            <i className="fa fa-code me-1" aria-hidden="true" />
            Edit HTML
          </button>
        </div>
      )}
      <div ref={containerRef} />

      {showHtmlModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit HTML</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowHtmlModal(false)}
                />
              </div>
              <div className="modal-body">
                <textarea
                  className="form-control font-monospace"
                  value={htmlSource}
                  onChange={(e) => setHtmlSource(e.target.value)}
                  rows={16}
                  placeholder="Paste or edit HTML here..."
                  spellCheck={false}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowHtmlModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={applyHtmlSource}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
