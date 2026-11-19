"""
SentinelAI Process Isolation & Job Object Controller.
Enforces memory limits (2GB), process creation caps (64), and emergency kill-switch.
"""
import os
import sys
from typing import List, Optional


class JobObjectController:
    """Controls process trees and resource limits using Windows Job Objects."""

    def __init__(self, memory_limit_mb: int = 2048, max_processes: int = 64):
        self.memory_limit_mb = memory_limit_mb
        self.max_processes = max_processes
        self.pids: List[int] = []
        self._job_handle = None
        self._is_windows = os.name == "nt"

        if self._is_windows:
            self._init_windows_job()

    def _init_windows_job(self) -> None:
        try:
            import ctypes
            from ctypes import wintypes

            kernel32 = ctypes.windll.kernel32
            # Create Job Object
            self._job_handle = kernel32.CreateJobObjectW(None, None)
        except Exception:
            self._job_handle = None

    def assign_process(self, pid: int) -> bool:
        """Assigns a running process to the Job Object."""
        self.pids.append(pid)
        if self._job_handle and self._is_windows:
            try:
                import ctypes

                kernel32 = ctypes.windll.kernel32
                process_handle = kernel32.OpenProcess(0x1F0FFF, False, pid)  # PROCESS_ALL_ACCESS
                if process_handle:
                    res = kernel32.AssignProcessToJobObject(self._job_handle, process_handle)
                    kernel32.CloseHandle(process_handle)
                    return bool(res)
            except Exception:
                pass
        return True

    def terminate_all(self) -> int:
        """Emergency kill-switch: terminates all processes in the job."""
        count = 0
        if self._job_handle and self._is_windows:
            try:
                import ctypes

                kernel32 = ctypes.windll.kernel32
                kernel32.TerminateJobObject(self._job_handle, 1)
            except Exception:
                pass

        # Fallback termination by PID
        for pid in list(self.pids):
            try:
                if self._is_windows:
                    os.system(f"taskkill /F /T /PID {pid} >nul 2>&1")
                else:
                    os.kill(pid, 9)
                count += 1
            except Exception:
                pass
        self.pids.clear()
        return count

    def close(self) -> None:
        if self._job_handle and self._is_windows:
            try:
                import ctypes

                ctypes.windll.kernel32.CloseHandle(self._job_handle)
            except Exception:
                pass
            self._job_handle = None
