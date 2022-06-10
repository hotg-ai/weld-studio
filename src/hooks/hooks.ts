import { TypedUseSelectorHook, useDispatch, useSelector, useStore } from "react-redux";
import type { AppStoreState, AppDispatch } from './../redux/store'
import { useEffect, useState } from "react";
import { AnyAction } from "redux";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<AppStoreState> = useSelector
export const useAppStore = () => useStore<AppStoreState, AnyAction>();

/**
 * An object implementing the circuit breaker pattern.
 */
export interface CircuitBreaker {
    /**
     * Ask the circuit breaker to invoke a function.
     *
     * This function will only be called the configured number of times, waiting
     * at least the requested duration before trying again. After the retry
     * threshold is `"triggered"`, `thunk` won't be called again unless the
     * `reset()` method is called.
     *
     * @param thunk The function to invoke.
     */
    call(thunk: () => void): "triggered" | "fired-thunk" | "waiting";
    /** Reset the circuit breaker. */
    reset(): void;
}

/**
 * A React hook that gives the user a circuit breaker they can use to retry an
 * operation several times before latching in the failed state.
 *
 * @param retries The number of times to retry the operation before the
 *                circuit breaker is "triggered".
 * @param interval The number of milliseconds to wait between calls.
 * @returns A circuit breaker.
 */
export function useCircuitBreaker(retries: number, interval: number): CircuitBreaker {
    const [attempts, setAttempts] = useState<number>(0);
    const [okayToFire, setOkayToFire] = useState(true);

    useEffect(() => {
        if (!okayToFire) {
            const token = setTimeout(() => setOkayToFire(true), interval);
            return () => clearTimeout(token);
        }
    }, [attempts, okayToFire, interval]);

    return {
        reset: () => {
            setAttempts(0);
            setOkayToFire(true);
        },
        call: (thunk: () => void) => {
            if (attempts >= retries) {
                // no more retries for you.
                return "triggered";
            } else if (okayToFire) {
                // invoke the callback.
                setOkayToFire(false);
                setAttempts(attempts + 1);
                thunk();
                return "fired-thunk";
            } else {
                // wait until it is okay to fire agaon
                return "waiting";
            }
        },
    }
}
