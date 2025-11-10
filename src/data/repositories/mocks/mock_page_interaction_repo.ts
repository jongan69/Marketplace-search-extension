import { PageInteractionRepo } from "../../../domain/repositories/page_interaction_repo";

export class MockPageInteractionRepo implements PageInteractionRepo {
  async getCurrentMarketplace(): Promise<string | null> {
    console.log("[MOCK] Getting current marketplace");
    return Promise.resolve("Facebook Marketplace");
  }
}
