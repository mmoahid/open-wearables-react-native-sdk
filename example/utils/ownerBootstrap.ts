import OpenWearablesHealthSDK from "open-wearables";
import { INITIAL_HOST, OWNER_BOOTSTRAP_TOKEN } from "./constants";

interface OwnerBootstrapResponse {
  access_token?: string;
  refresh_token?: string;
  user_id?: string;
}

const readJsonResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.trim().startsWith("<")
        ? "The server sent a web page instead of app data."
        : "The server sent a response the app could not read."
    );
  }
};

export const canBootstrapOwnerSession = () =>
  OWNER_BOOTSTRAP_TOKEN.length > 0;

export const bootstrapOwnerSession = async () => {
  if (!canBootstrapOwnerSession()) {
    throw new Error("Owner bootstrap token is not configured in this app build.");
  }

  await OpenWearablesHealthSDK.signOut();
  OpenWearablesHealthSDK.configure(INITIAL_HOST);

  const response = await fetch(`${INITIAL_HOST}/api/v1/owner/bootstrap`, {
    method: "POST",
    headers: {
      "X-Mo-Health-Bootstrap-Token": OWNER_BOOTSTRAP_TOKEN,
    },
  });

  const data = (await readJsonResponse(response)) as OwnerBootstrapResponse;

  if (!response.ok) {
    throw new Error(`Owner bootstrap failed with HTTP ${response.status}`);
  }

  if (!data.user_id || !data.access_token || !data.refresh_token) {
    throw new Error("Owner bootstrap returned an incomplete session.");
  }

  const bearerToken = data.access_token.startsWith("Bearer ")
    ? data.access_token
    : `Bearer ${data.access_token}`;

  await OpenWearablesHealthSDK.signIn(
    data.user_id,
    bearerToken,
    data.refresh_token,
    null
  );
};
