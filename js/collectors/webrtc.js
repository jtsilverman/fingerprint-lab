/**
 * WebRTC IP leak detection.
 * Can reveal local and public IPs even behind VPNs.
 */

export async function collectWebrtc() {
  if (!window.RTCPeerConnection) {
    return {
      name: 'WebRTC',
      category: 'network',
      value: 'not supported',
      displayValue: 'WebRTC not available',
      entropy: 0.5,
      description: 'WebRTC is not supported in this browser.',
    };
  }

  const ips = new Set();

  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.createDataChannel('');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise((resolve) => {
      const timeout = setTimeout(resolve, 3000);
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        const parts = event.candidate.candidate.split(' ');
        const ip = parts[4];
        if (ip && !ip.includes(':') && ip !== '0.0.0.0') {
          ips.add(ip);
        }
      };
    });

    pc.close();
  } catch (e) {
    // WebRTC blocked
  }

  const ipList = Array.from(ips);
  const blocked = ipList.length === 0;

  return {
    name: 'WebRTC',
    category: 'network',
    value: blocked ? 'blocked' : ipList,
    displayValue: blocked ? 'Blocked (good for privacy)' : ipList.join(', '),
    entropy: blocked ? 0.5 : 3.0,
    description: blocked
      ? 'Your browser blocks WebRTC IP leak. This is a positive privacy finding.'
      : 'WebRTC revealed your IP address(es) via STUN requests. This can expose your real IP even when using a VPN.',
    mitigation: 'Disable WebRTC in browser settings, or use an extension like WebRTC Leak Shield. Firefox: set media.peerconnection.enabled to false in about:config.',
  };
}
