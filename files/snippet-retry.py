from typing import Callable, TypeVar
import time

T = TypeVar("T")

def retry(fn: Callable[[], T], retries: int = 3, delay: float = 0.5) -> T:
    last_error = None
    for _ in range(retries):
        try:
            return fn()
        except Exception as exc:
            last_error = exc
            time.sleep(delay)
    raise last_error
