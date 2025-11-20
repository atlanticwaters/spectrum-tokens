/**
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TokenPreview } from './TokenPreview';
import type { Token } from './types';

describe('TokenPreview', () => {
  describe('color tokens', () => {
    it('renders color preview with correct background', () => {
      const token: Token = {
        name: 'primary-color',
        value: '#ff0000',
        type: 'color',
      };

      const { container } = render(<TokenPreview token={token} />);
      const preview = container.querySelector('div[style*="background"]');

      expect(preview).toBeInTheDocument();
      expect(preview).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('displays color value in title', () => {
      const token: Token = {
        name: 'primary-color',
        value: '#ff0000',
        type: 'color',
      };

      const { container } = render(<TokenPreview token={token} />);
      const preview = container.querySelector('div[title="#ff0000"]');

      expect(preview).toBeInTheDocument();
    });
  });

  describe('dimension tokens', () => {
    it('renders dimension with pixel value', () => {
      const token: Token = {
        name: 'spacing-small',
        value: 8,
        type: 'dimension',
      };

      render(<TokenPreview token={token} />);
      expect(screen.getByText('8px')).toBeInTheDocument();
    });

    it('renders spacing with pixel value', () => {
      const token: Token = {
        name: 'spacing-medium',
        value: 16,
        type: 'spacing',
      };

      render(<TokenPreview token={token} />);
      expect(screen.getByText('16px')).toBeInTheDocument();
    });
  });

  describe('typography tokens', () => {
    it('renders typography preview with Aa text', () => {
      const token: Token = {
        name: 'heading-1',
        value: { fontSize: 24, fontFamily: 'Inter' },
        type: 'typography',
      };

      render(<TokenPreview token={token} />);
      expect(screen.getByText('Aa')).toBeInTheDocument();
    });

    it('includes typography value in title', () => {
      const token: Token = {
        name: 'heading-1',
        value: { fontSize: 24, fontFamily: 'Inter' },
        type: 'typography',
      };

      const { container } = render(<TokenPreview token={token} />);
      const preview = container.querySelector('div[title]');

      expect(preview?.getAttribute('title')).toContain('fontSize');
    });
  });

  describe('effect tokens', () => {
    it('renders shadow preview', () => {
      const token: Token = {
        name: 'shadow-small',
        value: { type: 'DROP_SHADOW', blur: 4 },
        type: 'shadow',
      };

      render(<TokenPreview token={token} />);
      expect(screen.getByText('FX')).toBeInTheDocument();
    });

    it('renders effect preview', () => {
      const token: Token = {
        name: 'effect-glow',
        value: { type: 'INNER_SHADOW', blur: 2 },
        type: 'effect',
      };

      render(<TokenPreview token={token} />);
      expect(screen.getByText('FX')).toBeInTheDocument();
    });
  });

  describe('unknown token types', () => {
    it('renders generic preview for unknown types', () => {
      const token: Token = {
        name: 'custom-token',
        value: 'some-value',
        type: 'custom',
      };

      render(<TokenPreview token={token} />);
      expect(screen.getByText('CU')).toBeInTheDocument(); // First 2 chars uppercase
    });
  });

  describe('custom size', () => {
    it('respects custom size prop', () => {
      const token: Token = {
        name: 'primary-color',
        value: '#ff0000',
        type: 'color',
      };

      const { container } = render(<TokenPreview token={token} size={48} />);
      const preview = container.querySelector('div[style*="width"]');

      expect(preview).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('uses default size when not specified', () => {
      const token: Token = {
        name: 'primary-color',
        value: '#ff0000',
        type: 'color',
      };

      const { container } = render(<TokenPreview token={token} />);
      const preview = container.querySelector('div[style*="width"]');

      expect(preview).toHaveStyle({ width: '32px', height: '32px' });
    });
  });

  describe('accessibility', () => {
    it('includes aria-label for color preview', () => {
      const token: Token = {
        name: 'primary-color',
        value: '#ff0000',
        type: 'color',
      };

      render(<TokenPreview token={token} />);
      expect(screen.getByLabelText('Color preview: #ff0000')).toBeInTheDocument();
    });
  });
});
