/**
 * WebGL fingerprinting.
 * Extracts GPU renderer, vendor, extensions, and limits.
 */

import { sha256 } from '../hash.js';

export async function collectWebGL() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    return {
      name: 'WebGL',
      category: 'rendering',
      value: 'not supported',
      displayValue: 'WebGL not available',
      entropy: 1.0,
      description: 'WebGL is not supported or disabled in this browser.',
    };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'hidden';
  const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'hidden';

  const data = {
    renderer,
    vendor,
    version: gl.getParameter(gl.VERSION),
    shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    maxCubeMapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
    maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    aliasedLineWidthRange: Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)),
    aliasedPointSizeRange: Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)),
    extensions: gl.getSupportedExtensions()?.sort() || [],
  };

  const hash = await sha256(JSON.stringify(data));

  return {
    name: 'WebGL',
    category: 'rendering',
    value: data,
    displayValue: `${renderer} (${vendor})`,
    entropy: 7.5,
    description: 'Queries your GPU model, driver capabilities, and supported WebGL extensions. Each GPU/driver combination produces a different set of values.',
    mitigation: 'Firefox with resistFingerprinting hides the real GPU renderer. Brave randomizes some WebGL parameters.',
  };
}
