export {};

declare global {
  interface PuterUser {
    username?: string;
    email?: string;
  }

  interface PuterFileItem {
    path?: string;
    name?: string;
  }

  interface PuterAuth {
    isSignedIn: () => Promise<boolean>;
    signIn: () => Promise<void>;
    getUser: () => Promise<PuterUser>;
  }

  interface PuterFileSystem {
    upload: (files: File[] | Blob[]) => Promise<PuterFileItem | PuterFileItem[]>;
    delete?: (path: string) => Promise<void>;
  }

  interface PuterAI {
    feedback: (path: string, message: string) => Promise<unknown>;
    chat?: (prompt: string, imageOrOptions?: unknown) => Promise<unknown>;
  }

  interface PuterSDK {
    auth: PuterAuth;
    fs: PuterFileSystem;
    ai: PuterAI;
  }

  interface Window {
    puter?: PuterSDK;
  }
}
