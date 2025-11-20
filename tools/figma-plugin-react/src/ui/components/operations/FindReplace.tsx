import React, { useState } from 'react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import Checkbox from '../Checkbox';

export interface FindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: (find: string, replace: string, options: FindReplaceOptions) => void;
  tokens: Array<{ name: string; value: any; type: string }>;
}

export interface FindReplaceOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  scope: 'names' | 'values' | 'both';
}

export function FindReplace({ isOpen, onClose, onReplace, tokens }: FindReplaceProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [scope, setScope] = useState<'names' | 'values' | 'both'>('names');
  const [preview, setPreview] = useState<Array<{ old: string; new: string }>>([]);
  const [error, setError] = useState('');

  const handlePreview = () => {
    if (!findText) {
      setError('Find text cannot be empty');
      return;
    }

    setError('');
    const matches: Array<{ old: string; new: string }> = [];

    for (const token of tokens) {
      let newName = token.name;
      let newValue = String(token.value);

      if (scope === 'names' || scope === 'both') {
        try {
          newName = performReplace(token.name, findText, replaceText, {
            caseSensitive,
            wholeWord,
            regex: useRegex,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Replace error');
          return;
        }
      }

      if (scope === 'values' || scope === 'both') {
        try {
          newValue = performReplace(String(token.value), findText, replaceText, {
            caseSensitive,
            wholeWord,
            regex: useRegex,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Replace error');
          return;
        }
      }

      if (newName !== token.name || newValue !== String(token.value)) {
        matches.push({
          old: scope === 'names' ? token.name : String(token.value),
          new: scope === 'names' ? newName : newValue,
        });
      }
    }

    setPreview(matches);
  };

  const handleReplace = () => {
    if (!findText) {
      setError('Find text cannot be empty');
      return;
    }

    if (preview.length === 0) {
      setError('No matches found. Click Preview Changes first.');
      return;
    }

    onReplace(findText, replaceText, {
      caseSensitive,
      wholeWord,
      regex: useRegex,
      scope,
    });
    handleClose();
  };

  const handleClose = () => {
    setFindText('');
    setReplaceText('');
    setCaseSensitive(false);
    setWholeWord(false);
    setUseRegex(false);
    setScope('names');
    setPreview([]);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Find & Replace Tokens">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '500px' }}>
        <Input
          label="Find"
          value={findText}
          onChange={setFindText}
          placeholder="Search text or pattern"
        />

        <Input
          label="Replace with"
          value={replaceText}
          onChange={setReplaceText}
          placeholder="Replacement text"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Checkbox
            label="Case sensitive"
            checked={caseSensitive}
            onChange={setCaseSensitive}
          />
          <Checkbox
            label="Match whole word"
            checked={wholeWord}
            onChange={setWholeWord}
          />
          <Checkbox
            label="Use regular expressions"
            checked={useRegex}
            onChange={setUseRegex}
          />
        </div>

        <div>
          <label htmlFor="scope-select" style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Scope
          </label>
          <select
            id="scope-select"
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
            style={{ width: '100%', padding: '6px' }}
          >
            <option value="names">Token names only</option>
            <option value="values">Token values only</option>
            <option value="both">Both names and values</option>
          </select>
        </div>

        {error && (
          <div style={{ color: 'red', fontSize: '12px', padding: '4px' }} role="alert">
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={handlePreview}>
            Preview Changes
          </Button>
        </div>

        {preview.length > 0 && (
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '8px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>
              {preview.length} match(es) found:
            </div>
            {preview.map((item, index) => (
              <div key={index} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#999' }}>{item.old}</span>
                {' → '}
                <span style={{ color: '#0d66d0' }}>{item.new}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleReplace} disabled={!findText || preview.length === 0}>
            Replace All ({preview.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function performReplace(
  text: string,
  find: string,
  replace: string,
  options: { caseSensitive: boolean; wholeWord: boolean; regex: boolean }
): string {
  if (options.regex) {
    try {
      const flags = options.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(find, flags);
      return text.replace(regex, replace);
    } catch (err) {
      throw new Error(`Invalid regular expression: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  if (options.wholeWord) {
    const escapedFind = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedFind}\\b`, options.caseSensitive ? 'g' : 'gi');
    return text.replace(regex, replace);
  }

  if (options.caseSensitive) {
    return text.split(find).join(replace);
  } else {
    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return text.replace(regex, replace);
  }
}
