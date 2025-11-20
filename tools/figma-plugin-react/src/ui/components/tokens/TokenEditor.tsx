import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToken, updateToken, clearError } from '../../store/slices/tokensSlice';
import {
  validateColorToken,
  validateDimensionToken,
  validateOpacityToken,
} from '../../../utils/tokenValidation';

export interface TokenEditorProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
}

/**
 * TokenEditor component for creating and editing design tokens.
 * Uses Redux for state management, reading editingToken from the store.
 */
export function TokenEditor({
  isOpen,
  onClose,
  mode = 'create',
}: TokenEditorProps) {
  const dispatch = useAppDispatch();
  const editingToken = useAppSelector((state) => state.tokens.editingToken);
  const storeError = useAppSelector((state) => state.tokens.error);

  const [name, setName] = useState('');
  const [type, setType] = useState('color');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  // Load editing token data when it changes
  useEffect(() => {
    if (editingToken) {
      setName(editingToken.name);
      setType(editingToken.type);
      setValue(editingToken.value);
      setDescription(editingToken.description || '');
    } else {
      // Reset form when opening in create mode
      setName('');
      setType('color');
      setValue('');
      setDescription('');
    }
    setLocalError('');
    setWarnings([]);
  }, [editingToken, isOpen]);

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      setLocalError('Token name is required');
      return;
    }

    if (!value && value !== 0) {
      setLocalError('Token value is required');
      return;
    }

    // Validate value based on type using comprehensive validators
    let validationResult;

    switch (type) {
      case 'color':
        validationResult = validateColorToken(String(value));
        break;
      case 'dimension':
      case 'spacing':
      case 'fontSize':
        validationResult = validateDimensionToken(value);
        break;
      case 'opacity':
        validationResult = validateOpacityToken(value);
        break;
      case 'fontWeight':
        // Font weight has specific validation
        const num = Number(value);
        if (isNaN(num) || num < 100 || num > 900 || num % 100 !== 0) {
          setLocalError('Font weight must be 100-900 in increments of 100');
          return;
        }
        validationResult = { isValid: true };
        break;
      default:
        // For other types, allow any value
        validationResult = { isValid: true };
    }

    if (!validationResult.isValid) {
      setLocalError(validationResult.error || 'Invalid value');
      return;
    }

    // Set warnings if any
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      setWarnings(validationResult.warnings);
    } else {
      setWarnings([]);
    }

    setLocalError('');

    // Dispatch to Redux based on mode
    const token = { name, value, type, description };
    if (mode === 'edit' && editingToken) {
      dispatch(updateToken({ name: editingToken.name, updates: token }));
    } else {
      dispatch(addToken(token));
    }

    handleClose();
  };

  const handleClose = () => {
    setName('');
    setValue('');
    setType('color');
    setDescription('');
    setLocalError('');
    setWarnings([]);
    dispatch(clearError());
    onClose();
  };

  // Combined error display (local validation errors take precedence)
  const displayError = localError || storeError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create Token' : 'Edit Token'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '400px' }}>
        <Input
          label="Token Name"
          value={name}
          onChange={setName}
          placeholder="primary-color"
          disabled={mode === 'edit'}
        />

        <div>
          <label htmlFor="token-type" style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Token Type
          </label>
          <select
            id="token-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={mode === 'edit'}
            style={{ width: '100%', padding: '6px' }}
          >
            <option value="color">Color</option>
            <option value="dimension">Dimension</option>
            <option value="spacing">Spacing</option>
            <option value="opacity">Opacity</option>
            <option value="fontFamily">Font Family</option>
            <option value="fontSize">Font Size</option>
            <option value="fontWeight">Font Weight</option>
            <option value="lineHeight">Line Height</option>
            <option value="letterSpacing">Letter Spacing</option>
          </select>
        </div>

        {renderValueEditor(type, value, setValue)}

        <Input
          label="Description (optional)"
          value={description}
          onChange={setDescription}
          placeholder="Brief description of this token"
        />

        {displayError && (
          <div style={{ color: '#d32f2f', fontSize: '12px', padding: '4px', backgroundColor: '#ffebee', borderRadius: '4px' }} role="alert">
            {displayError}
          </div>
        )}

        {warnings.length > 0 && (
          <div style={{ color: '#f57c00', fontSize: '12px', padding: '4px', backgroundColor: '#fff3e0', borderRadius: '4px' }} role="status">
            {warnings.map((warning, index) => (
              <div key={index}>{warning}</div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function renderValueEditor(type: string, value: any, onChange: (value: any) => void) {
  switch (type) {
    case 'color':
      return (
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Color Value
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#FF0000"
              style={{ flex: 1, padding: '6px' }}
              aria-label="Color value text"
            />
            <input
              type="color"
              value={value.startsWith('#') ? value : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: '40px', height: '32px' }}
              aria-label="Color picker"
            />
          </div>
        </div>
      );

    case 'dimension':
    case 'spacing':
    case 'fontSize':
      return (
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Value (pixels)
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="16"
            style={{ width: '100%', padding: '6px' }}
            aria-label="Dimension value"
          />
        </div>
      );

    case 'opacity':
      return (
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Opacity (0-1)
          </label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.5"
            style={{ width: '100%', padding: '6px' }}
            aria-label="Opacity value"
          />
        </div>
      );

    case 'fontFamily':
      return (
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Font Family
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Inter"
            style={{ width: '100%', padding: '6px' }}
            aria-label="Font family"
          />
        </div>
      );

    case 'fontWeight':
      return (
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Font Weight
          </label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: '100%', padding: '6px' }}
            aria-label="Font weight"
          >
            <option value="100">Thin (100)</option>
            <option value="200">Extra Light (200)</option>
            <option value="300">Light (300)</option>
            <option value="400">Regular (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi Bold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>
      );

    case 'lineHeight':
    case 'letterSpacing':
      return (
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Value
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={type === 'lineHeight' ? '1.5' : '0.5px'}
            style={{ width: '100%', padding: '6px' }}
            aria-label={type === 'lineHeight' ? 'Line height' : 'Letter spacing'}
          />
        </div>
      );

    default:
      return (
        <Input
          label="Value"
          value={value}
          onChange={onChange}
          placeholder="Enter token value"
        />
      );
  }
}

