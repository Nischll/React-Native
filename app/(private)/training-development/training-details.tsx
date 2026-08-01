import ScreenContainer from "@/src/components/layout/ScreenContainer";
import TrainingDetails from "@/src/screens/private/Training/TrainingDetails";
export default function Page() {
  return (<ScreenContainer virtualized refreshable={false}><TrainingDetails /></ScreenContainer>);
}
