"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || "ws://localhost:3001";

// Connection status type
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// Hook for Yjs document collaboration
export function useYjsDocument(
  roomId: string,
  options: {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
    onSync?: (isSynced: boolean) => void;
  } = {}
) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [isSynced, setIsSynced] = useState(false);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create WebSocket provider
    const provider = new WebsocketProvider(REALTIME_URL, roomId, ydoc);
    providerRef.current = provider;

    // Set up event handlers
    provider.on("status", (event: { status: ConnectionStatus }) => {
      setStatus(event.status);
      if (event.status === "connected") {
        options.onConnect?.();
      } else if (event.status === "disconnected") {
        options.onDisconnect?.();
      }
    });

    provider.on("sync", (isSynced: boolean) => {
      setIsSynced(isSynced);
      options.onSync?.(isSynced);
    });

    provider.on("connection-error", (event: Event) => {
      setStatus("error");
      options.onError?.(new Error("Connection error"));
    });

    // Cleanup
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId, options.onConnect, options.onDisconnect, options.onError, options.onSync]);

  // Get a Yjs map
  const getMap = useCallback(<T extends Record<string, unknown>>(name: string): Y.Map<T> => {
    if (!ydocRef.current) {
      throw new Error("Yjs document not initialized");
    }
    return ydocRef.current.getMap(name) as Y.Map<T>;
  }, []);

  // Get a Yjs array
  const getArray = useCallback(<T>(name: string): Y.Array<T> => {
    if (!ydocRef.current) {
      throw new Error("Yjs document not initialized");
    }
    return ydocRef.current.getArray(name) as Y.Array<T>;
  }, []);

  // Get a Yjs text
  const getText = useCallback((name: string): Y.Text => {
    if (!ydocRef.current) {
      throw new Error("Yjs document not initialized");
    }
    return ydocRef.current.getText(name);
  }, []);

  // Get the awareness API
  const getAwareness = useCallback(() => {
    return providerRef.current?.awareness;
  }, []);

  return {
    ydoc: ydocRef.current,
    provider: providerRef.current,
    status,
    isSynced,
    getMap,
    getArray,
    getText,
    getAwareness,
  };
}

// Hook for collaborative cursor positions
export function useCollaborativeCursors(roomId: string) {
  const [cursors, setCursors] = useState<Map<number, { x: number; y: number; color: string; name: string }>>(
    new Map()
  );
  const { getAwareness } = useYjsDocument(roomId);

  useEffect(() => {
    const awareness = getAwareness();
    if (!awareness) return;

    const handleChange = () => {
      const newCursors = new Map<number, { x: number; y: number; color: string; name: string }>();
      awareness.getStates().forEach((state, clientId) => {
        if (state.cursor && clientId !== awareness.clientID) {
          newCursors.set(clientId, state.cursor as { x: number; y: number; color: string; name: string });
        }
      });
      setCursors(newCursors);
    };

    awareness.on("change", handleChange);
    handleChange(); // Initial sync

    return () => {
      awareness.off("change", handleChange);
    };
  }, [getAwareness]);

  const updateCursor = useCallback(
    (x: number, y: number) => {
      const awareness = getAwareness();
      if (!awareness) return;

      awareness.setLocalStateField("cursor", { x, y });
    },
    [getAwareness]
  );

  return { cursors, updateCursor };
}

// Hook for presence (online users)
export function usePresence(roomId: string, userInfo: { name: string; color: string }) {
  const [users, setUsers] = useState<Map<number, { name: string; color: string }>>(new Map());
  const { getAwareness } = useYjsDocument(roomId);

  useEffect(() => {
    const awareness = getAwareness();
    if (!awareness) return;

    // Set user info
    awareness.setLocalStateField("user", userInfo);

    const handleChange = () => {
      const newUsers = new Map<number, { name: string; color: string }>();
      awareness.getStates().forEach((state, clientId) => {
        if (state.user && clientId !== awareness.clientID) {
          newUsers.set(clientId, state.user as { name: string; color: string });
        }
      });
      setUsers(newUsers);
    };

    awareness.on("change", handleChange);
    handleChange();

    return () => {
      awareness.off("change", handleChange);
    };
  }, [getAwareness, userInfo]);

  return users;
}

// Hook for collaborative array (e.g., list of items)
export function useCollaborativeArray<T>(
  roomId: string,
  arrayName: string,
  options: {
    onAdd?: (item: T, index: number) => void;
    onDelete?: (item: T, index: number) => void;
    onUpdate?: (item: T, index: number) => void;
  } = {}
) {
  const [items, setItems] = useState<T[]>([]);
  const { getArray, isSynced } = useYjsDocument(roomId);

  useEffect(() => {
    if (!isSynced) return;

    const yarray = getArray<T>(arrayName);

    const updateItems = () => {
      setItems(yarray.toArray());
    };

    // Set up observers
    yarray.observe((event) => {
      updateItems();
      event.changes.delta.forEach((change) => {
        if ("insert" in change && options.onAdd) {
          const items = change.insert as T[];
          items.forEach((item, idx) => options.onAdd!(item, idx));
        }
        if ("delete" in change && options.onDelete) {
          // Note: We don't have the deleted items in the delta
          options.onDelete?.({} as T, change.delete as number);
        }
      });
    });

    updateItems();

    return () => {
      yarray.unobserve(updateItems);
    };
  }, [getArray, isSynced, arrayName, options.onAdd, options.onDelete]);

  const addItem = useCallback(
    (item: T, index?: number) => {
      const yarray = getArray<T>(arrayName);
      if (index !== undefined) {
        yarray.insert(index, [item]);
      } else {
        yarray.push([item]);
      }
    },
    [getArray, arrayName]
  );

  const deleteItem = useCallback(
    (index: number) => {
      const yarray = getArray<T>(arrayName);
      yarray.delete(index, 1);
    },
    [getArray, arrayName]
  );

  const updateItem = useCallback(
    (index: number, item: T) => {
      const yarray = getArray<T>(arrayName);
      yarray.delete(index, 1);
      yarray.insert(index, [item]);
    },
    [getArray, arrayName]
  );

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      const yarray = getArray<T>(arrayName);
      const [item] = yarray.slice(fromIndex, fromIndex + 1);
      yarray.delete(fromIndex, 1);
      yarray.insert(toIndex, [item]);
    },
    [getArray, arrayName]
  );

  return {
    items,
    addItem,
    deleteItem,
    updateItem,
    moveItem,
    isSynced,
  };
}

// Hook for collaborative map (e.g., object properties)
export function useCollaborativeMap<T extends Record<string, unknown>>(
  roomId: string,
  mapName: string
) {
  const [data, setData] = useState<T>({} as T);
  const { getMap, isSynced } = useYjsDocument(roomId);

  useEffect(() => {
    if (!isSynced) return;

    const ymap = getMap<T>(mapName);

    const updateData = () => {
      setData(ymap.toJSON() as T);
    };

    ymap.observe(updateData);
    updateData();

    return () => {
      ymap.unobserve(updateData);
    };
  }, [getMap, isSynced, mapName]);

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const ymap = getMap<T>(mapName);
      ymap.set(key as string, value as T);
    },
    [getMap, mapName]
  );

  const deleteValue = useCallback(
    (key: keyof T) => {
      const ymap = getMap<T>(mapName);
      ymap.delete(key as string);
    },
    [getMap, mapName]
  );

  return {
    data,
    setValue,
    deleteValue,
    isSynced,
  };
}
