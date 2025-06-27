import TabContent from './components/TabContent/TabContent';

/**
 * @param {Object} props
 * @returns {import('react').ReactElement}
 */
export default function TaskTesting(props) {

  return (
    <TabContent { ...props } />
  );
}