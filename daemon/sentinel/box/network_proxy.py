"""
SentinelAI Egress Network Proxy & Domain Allowlist Filter (Port 8899).
Blocks direct IP outbound connections and limits sandbox egress to declared domains.
"""
import fnmatch
import ipaddress
import re
from typing import List, Optional, Set

DEFAULT_ALLOWED_DOMAINS = [
    "api.anthropic.com",
    "api.openai.com",
    "registry.npmjs.org",
    "pypi.org",
    "files.pythonhosted.org",
    "github.com",
    "*.github.com",
    "*.githubusercontent.com",
    "localhost",
    "127.0.0.1",
]


class NetworkAllowlistFilter:
    """Evaluates whether an outbound connection target is permitted."""

    def __init__(self, allowed_domains: Optional[List[str]] = None):
        self.allowed_patterns: List[str] = allowed_domains or list(DEFAULT_ALLOWED_DOMAINS)

    def is_ip_address(self, host: str) -> bool:
        """Checks if the host is a raw IP address."""
        clean_host = host.split(":")[0]
        try:
            ipaddress.ip_address(clean_host)
            return True
        except ValueError:
            return False

    def is_loopback(self, host: str) -> bool:
        clean_host = host.split(":")[0].lower()
        return clean_host in ["localhost", "127.0.0.1", "::1"]

    def is_allowed(self, target: str) -> bool:
        """
        Evaluates whether a host or URL is permitted through the egress filter.
        Returns False for raw external IPs and domains not in allowlist.
        """
        # Strip scheme and path if present
        host = target.replace("http://", "").replace("https://", "").split("/")[0].split(":")[0].lower()

        # If it's a loopback IP/localhost, allow
        if self.is_loopback(host):
            return True

        # Reject all external raw IP addresses
        if self.is_ip_address(host):
            return False

        # Match against allowed domain patterns
        for pattern in self.allowed_patterns:
            if fnmatch.fnmatch(host, pattern.lower()):
                return True

        return False
