import SafeEventEmitter from "@metamask/safe-event-emitter";
import { PollingBlockTracker, Provider } from "eth-block-tracker";
import {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from "json-rpc-engine";

import { RequestArguments, Web3Provider } from "./Web3Provider";

const createSubscriptionManager = require("eth-json-rpc-filters/subscriptionManager");
const noop = () => {};

export interface SubscriptionResult {
  result?: unknown;
}

export interface SubscriptionNotification {
  method: string;
  params: {
    subscription: string;
    result: unknown;
  };
}

export class SubscriptionManager {
  private readonly subscriptionMiddleware: SubscriptionMiddleware;
  readonly events: SafeEventEmitter;

  constructor(provider: Web3Provider & SafeEventEmitter) {
    const blockTracker = new PollingBlockTracker({
      provider: provider as Provider,
      pollingInterval: 15 * 1000, // 15 sec
      setSkipCacheFlag: true,
    });

    const { events, middleware } = createSubscriptionManager({
      blockTracker,
      provider,
    });

    this.events = events;
    this.subscriptionMiddleware = middleware;
  }

  public async handleRequest(request: {
    method: string;
    params: any[];
  }): Promise<SubscriptionResult> {
    const result = {};
    await this.subscriptionMiddleware(request, result, noop, noop);
    return result;
  }

  public destroy() {
    this.subscriptionMiddleware.destroy();
  }
}

interface SubscriptionMiddleware {
  (
    req: RequestArguments,
    res: SubscriptionResult,
    next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
  ): Promise<void>;

  destroy(): void;
}
