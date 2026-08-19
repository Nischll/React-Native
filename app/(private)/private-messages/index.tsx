import { Redirect } from "expo-router";

export default function PrivateMessagesRedirect() {
  return <Redirect href="/(private)/(tabs)/private-messages" />;
}
