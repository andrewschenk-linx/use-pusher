import { useCallback, useEffect, useRef, useState } from "react";

import { EventCallback } from "pusher-js";
import invariant from "invariant";

import { usePusher } from "./usePusher";
import { useChannelOptions } from "./types";

/**
 * Subscribe to channel events
 *
 * @example
 * useChannel(
 *   "my-channel",
 *   "my-event",
 *   (message) => console.log(message)
 * )
 */

export function useChannel(
  channelName: string,
  eventName?: string,
  onEvent?: (message: any) => void,
  dependencies?: any[],
  options?: useChannelOptions
) {
  // errors for missing arguments
  invariant(channelName, "channelName required to subscribe to a channel");

  // initialise defaults
  const defaultOptions = { skip: false };
  const hookOptions = options
    ? { ...defaultOptions, ...options }
    : defaultOptions;
  const eventHandler = onEvent ? onEvent : () => {};
  const deps = dependencies ? dependencies : [];

  // hook setup
  const { client } = usePusher();
  const [channel, setChannel] = useState<any>();

  /**
   * Channel subscription
   */
  useEffect(() => {
    if (client.current && !hookOptions.skip) {
      // subscribe to the channel
      const pusherChannel = client.current.subscribe(channelName);
      setChannel(pusherChannel);
    }
  }, [client.current, hookOptions.skip]);

  const previousChannelName = useRef<string | undefined>();
  useEffect(() => {
    if (previousChannelName.current === channelName) return;
    const clientRef = client.current;
    return () => {
      clientRef.unsubscribe(channelName);
    };
  });
  // track channelName for unsubscription.
  useEffect(() => {
    previousChannelName.current = channelName;
  });

  /**
   * Event binding
   */
  const callback = useCallback<EventCallback>(eventHandler, deps);
  useEffect(() => {
    if (channel && eventName && !hookOptions.skip) {
      channel.bind(eventName, callback);
    }
  }, [channel, eventName, hookOptions.skip, callback]);

  // when the callback changes, unbind the old one.
  useEffect(() => {
    return () => {
      if (client && channel && eventName) {
        channel.unbind(eventName, callback);
      }
    };
  }, [client, channel, callback, eventName]);

  return { channel };
}
