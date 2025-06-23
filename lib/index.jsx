import TabContent from './components/TabContent';

/**
 * @param {Object} props
 * @returns {import('react').ReactElement}
 */
export default function TaskTesting(props) {

  return (
    <TabContent { ...props } />
  );
}