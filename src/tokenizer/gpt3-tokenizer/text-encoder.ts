// import { TextEncoder } from 'util';

if (typeof TextEncoder === 'undefined') {
    throw new Error(
        'TextEncoder is required for this module to work in the browser'
    );
}

export default TextEncoder;
