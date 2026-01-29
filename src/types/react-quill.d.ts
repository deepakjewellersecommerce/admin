declare module 'react-quill' {
  import { Component } from 'react';
  export interface ReactQuillProps {
    [key: string]: any;
  }
  class ReactQuill extends Component<ReactQuillProps> {}
  export default ReactQuill;
}
