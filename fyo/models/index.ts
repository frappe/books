import { ModelMap } from 'fyo/model/types';
import BatchSeries from './BatchSeries';
import NumberSeries from './NumberSeries';
import SerialNumberSeries from './SerialNumberSeries';
import SystemSettings from './SystemSettings';
import { CustomField } from './CustomField';
import { CustomForm } from './CustomForm';

export const coreModels = {
  BatchSeries,
  NumberSeries,
  SerialNumberSeries,
  SystemSettings,
  CustomForm,
  CustomField,
} as ModelMap;
