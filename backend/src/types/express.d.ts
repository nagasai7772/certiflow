export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        district: string | null;
        trainingCentreId: string | null;
      };
    }
  }
}