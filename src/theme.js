import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../tailwind.config';

export default resolveConfig(tailwindConfig).theme;
