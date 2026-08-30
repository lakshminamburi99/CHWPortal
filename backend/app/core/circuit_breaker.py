"""
Enterprise Circuit Breaker:
Protects backend applications from cascading failures during cloud service outages.
"""
import time
from typing import Callable, Any


class CircuitBreakerOpenException(Exception):
    """Raised when the circuit breaker is OPEN and calls are rejected."""
    pass


class EnterpriseCircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_time_secs: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_time_secs = recovery_time_secs
        self.failure_count = 0
        self.last_state_change = time.time()
        self.state = "CLOSED"   # CLOSED | OPEN | HALF_OPEN

    def call(self, func: Callable, *args, **kwargs) -> Any:
        now = time.time()

        if self.state == "OPEN":
            if now - self.last_state_change > self.recovery_time_secs:
                self.state = "HALF_OPEN"
                self.last_state_change = now
            else:
                raise CircuitBreakerOpenException("Circuit breaker OPEN. Request rejected for fault tolerance.")

        try:
            result = func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                self.last_state_change = now
            return result
        except Exception as e:
            self.failure_count += 1
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                self.last_state_change = now
            raise e
