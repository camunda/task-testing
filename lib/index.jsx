import TaskTesting from './components/TaskTesting/TaskTesting';
import { ElementVariablesProvider } from './contexts/ElementVariablesContext';

// TODO(@jarekdanielak): Add types for props
export default function TaskTestingWrapper(props) {

  const { injector } = props;

  return (
    <ElementVariablesProvider injector={ injector }>
      <TaskTesting { ...props } />
    </ElementVariablesProvider>
  );
}