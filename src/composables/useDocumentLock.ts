import { ref } from "vue";
import { acquireLock, releaseLock } from "@/api/sharedDocument";

type LockState = "unlocked" | "lockedBySomeone" | "lockedByMe";

export function useDocumentLock(roomId: string) {

    const lockState = ref<LockState>("unlocked");
    let currentSessionId = "";
    let isAcquiringLock = false;

    const tryLock = async (): Promise<boolean> => {
        isAcquiringLock = true;
        try {
            const response = await acquireLock(roomId);
            lockState.value = "lockedByMe";
            currentSessionId = response.session_id || "";
            return true;
        } catch (error: any) {
            if (error.status === 409) {
                lockState.value = "lockedBySomeone";
                return false;
            }
            throw error;
        } finally {
            isAcquiringLock = false;
        }
    }

    const unlock = async (): Promise<void> => {
        if (lockState.value !== "lockedByMe") return;

        try {
            await releaseLock(roomId);
        } finally 
        {
            lockState.value = "unlocked";
        }
    }

    return {
        lockState,
        currentSessionId,
        isAcquiringLock,
        tryLock,
        unlock,
    }
}