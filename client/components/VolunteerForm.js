import React from 'react';
import _ from 'lodash';
import { Button, Form, FormRow, FormField, FormInput, FormSelect, FileUpload, Checkbox, Alert, Spinner } from 'elemental';
import DateInput from './DateInput';
import ListEditor from './ListEditor';
import * as http from '../lib/http';
import formData from '../lib/formData';
import questions from '../../shared/questions.json';
import groupsJSON from '../../shared/groups.json';

const groups = groupsJSON.map(name => ({ value: name, label: _.startCase(name) }));

const boatDriverPermits = [
   { value: '', label: 'none' },
   { value: 'Class 1', label: 'Class 1' },
   { value: 'Class 2', label: 'Class 2' },
   { value: 'Class 3', label: 'Class 3' },
];

const availabilityFields = ['from', 'till', 'confirmationTill']
   .map(name => ({ name, type: 'date' }));

const workExperienceFields = ['employer', 'role', 'time', 'location'].map(name => ({ name }));

const indentStyle = { paddingLeft: 23 };

export default React.createClass({

   propTypes: {
      volunteer: React.PropTypes.object,
   },

   getDefaultProps() {
      return {
         volunteer: {},
      };
   },

   getInitialState() {
      return {
         message: null,
         isSubmitting: false,
      };
   },

   onChange(event) {
      if (event.target) {
         const target = event.target;
         if (target.type === 'file') {
            this.setState({ [target.name]: target.files[0] });
         }
         else if (target.type === 'checkbox') {
            this.setState({ [target.name]: target.checked });
         }
         else {
            this.setState({ [target.name]: target.value });
         }
      }
      else {
         this.setState({ [event.name]: event.value });
      }
   },

   onSubmit() {
      this.setState({ isSubmitting: true });

      const values = _.omit(this.state, _.keys(this.getInitialState()));
      const body = formData(values);

      http.put('/api/volunteer', { body })
         .then(() => {
            this.setState({ isSubmitting: false });
            this.setMessage('Changes were saved.', 'success');
         })
         .catch(error => this.setMessage(error.message, 'danger'));
   },

   setAvailabilities(availabilities) {
      this.setState({ availabilities });
   },

   setWorkExperience(workExperience) {
      this.setState({ workExperience });
   },

   setMessage(text, type) {
      this.setState({ message: { text, type } });
      _.delay(() => this.setState({ message: null }), 3000);
   },

   render() {
      const state = Object.assign({}, this.props.volunteer, this.state);

      // TODO Ugly – build something better
      const showImage = name => state[name] && state[name].filename
         ? <img src={`/uploads/${state[name].filename}`} alt={name} style={{ height: 100, marginBottom: 10 }} />
         : null;

      return (
         <div>
            {this.state.message &&
               <Alert type={this.state.message.type}>{this.state.message.text}</Alert>
            }
            <Form onChange={this.onChange}>

               <FormRow>
                  <FormField label="First name" width="one-half">
                     <FormInput name="name.first" type="text" defaultValue={state.name.first} />
                  </FormField>
                  <FormField label="Last name" width="one-half">
                     <FormInput name="name.last" type="text" defaultValue={state.name.last} />
                  </FormField>
               </FormRow>

               <FormRow>
                  <FormField label="Email address" width="one-half">
                     <FormInput name="email" type="email" defaultValue={state.email} />
                  </FormField>
                  <FormField label="Date of Birth" width="one-half">
                     <DateInput
                        name="birth"
                        defaultValue={state.birth}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        onChange={value => this.onChange({ name: 'birth', value })}
                     />
                  </FormField>
               </FormRow>

               <FormRow>
                  <FormField label="Phone number" width="one-half">
                     <FormInput name="phone" type="text" defaultValue={state.phone} />
                  </FormField>
                  <FormField label="Emergency Contacts" width="one-half">
                     <FormInput name="emergencyContacts" type="text" defaultValue={state.emergencyContacts} />
                  </FormField>
               </FormRow>

               <FormRow>
                  <FormField label="Languages" width="one-half">
                     <FormInput name="languages" type="text" defaultValue={state.languages} />
                  </FormField>
                  <FormField label="Citizenship / Dual Citizenship" width="one-half">
                     <FormInput name="citizenship" type="text" defaultValue={state.citizenship} />
                  </FormField>
               </FormRow>

               <FormRow>
                  <FormField label="Address" width="one-half">
                     <FormInput name="address" type="text" multiline defaultValue={state.address} />
                  </FormField>
                  <FormField label="Notes" width="one-half">
                     <FormInput name="notes" type="text" multiline defaultValue={state.notes} />
                  </FormField>
               </FormRow>

               <FormField>
                  {showImage('photo')}
                  <FileUpload name="photo" buttonLabelInitial="Upload a photo of you" buttonLabelChange="Change your photo" file={state.photo} />
               </FormField>

               <hr />

               <h3>Availabilities</h3>

               <ListEditor
                  headings={['Available from', 'Available till', 'Confirmation till']}
                  fields={availabilityFields}
                  values={state.availabilities}
                  onChange={this.setAvailabilities}
               />

               <hr />

               <h3>Qualification</h3>

               <FormRow>
                  <FormField label="Group" width="one-half">
                     <FormSelect name="group" options={groups} defaultValue={state.group} onChange={_.noop} />
                  </FormField>
                  <FormField label="Boat Driver Permit" width="one-half">
                     <FormSelect name="boatDriverPermit" options={boatDriverPermits} defaultValue={state.boatDriverPermit} onChange={_.noop} />
                  </FormField>
               </FormRow>

               <FormField>
                  <Checkbox name="driversLicence" label="Driver's Licence" defaultChecked={state.driversLicence} />
                  {state.driversLicence &&
                     <div style={indentStyle}>
                        <Checkbox name="truckDriversLicence" label="Truck Driver's Licence" defaultChecked={state.truckDriversLicence} />
                        <Checkbox name="internationalDriversLicence" label="International Driver's Licence" defaultChecked={state.internationalDriversLicence} />
                        <Checkbox name="internationalTruckDriversLicence" label="International Truck Driver's Licence" defaultChecked={state.internationalTruckDriversLicence} />
                     </div>
                  }

                  <Checkbox name="paramedic" label="Paramedic" defaultChecked={state.paramedic} />

                  <label className="Checkbox">
                     <input type="checkbox" className="Checkbox__input" name="doctor" defaultChecked={state.doctor} />
                     <span className="Checkbox__label">Doctor</span>
                     {state.doctor &&
                        <div style={indentStyle}>
                           <label className="FormLabel">Specialization</label>
                           <FormInput name="doctorSpecialization" type="text" defaultValue={state.doctorSpecialization} />
                        </div>
                     }
                  </label>

                  <Checkbox name="emergencydoctor" label="Emergency Doctor" defaultChecked={state.emergencydoctor} />
                  <Checkbox name="lifeguard" label="Lifeguard" defaultChecked={state.lifeguard} />
                  <Checkbox name="experienceOnSea" label="Experience on Sea" defaultChecked={state.experienceOnSea} />
               </FormField>

               <FormRow>
                  <FormField width="one-half">
                     {showImage('passport')}
                     <FileUpload
                        name="passport"
                        buttonLabelInitial="Upload a scan of your passport"
                        buttonLabelChange="Change the scan of your passport"
                        file={state.passport}
                     />
                  </FormField>

                  {state.group === 'journalist' &&
                     <FormField width="one-half">
                        {showImage('presscard')}
                        <FileUpload
                           name="presscard"
                           buttonLabelInitial="Upload a scan of your presscard"
                           buttonLabelChange="Change the scan of your presscard"
                           file={state.presscard}
                        />
                     </FormField>
                  }

                  {state.group === 'medic' &&
                     <FormField width="one-half">
                        {showImage('approbation')}
                        <FileUpload
                           name="approbation"
                           buttonLabelInitial="Upload a scan of your approbation"
                           buttonLabelChange="Change the scan of your approbation"
                           file={state.approbation}
                        />
                     </FormField>
                  }
               </FormRow>

               <hr />

               <h3>Work Experience</h3>

               <ListEditor
                  headings={['Name of employer', 'Title / role', 'Dates worked', 'Location']}
                  fields={workExperienceFields}
                  values={state.workExperience}
                  onChange={this.setWorkExperience}
               />

               <hr />

               <h3>Questions</h3>

               <Alert type="info">
                  The following information is confidential and will only be reviewed by the person responsible for crewing. We guarantee that your information will not be shared with third parties and is not accessable by other members / employees at Cadus.
               </Alert>

               {_.map(questions['Questions'], (value, key) =>
                  <FormField label={value} key={key}>
                     <FormInput name={key} type="text" defaultValue={state[key]} />
                  </FormField>
               )}

               <h3>Personal environment</h3>

               <p>Your experiences during a mission can best be processed if you have a stable and supporting personal environment. If in your current life situation everything is upheaval, this might not be the right time for a mission.</p>

               {_.map(questions['Personal environment'], (value, key) =>
                  <FormField label={value} key={key}>
                     <FormInput name={key} type="text" defaultValue={state[key]} />
                  </FormField>
               )}

               <hr />

               <Button type="primary" onClick={this.onSubmit}>
                  Save Data {this.state.isSubmitting && <Spinner type="inverted" />}
               </Button>
            </Form>
         </div>
      );
   },

});
