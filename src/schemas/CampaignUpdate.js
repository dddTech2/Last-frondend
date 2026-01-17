/**
 * @class CampaignUpdate
 * @description Represents the schema for updating an existing campaign.
 */
class CampaignUpdate {
  /**
   * @param {object} data - The campaign data.
   * @param {string} [data.name] - Descriptive name of the campaign.
   * @param {string} [data.channel_type] - Communication channel ('SMS', 'WHATSAPP', 'EMAIL').
   * @param {string} [data.message_template_id] - UUID of the message template.
   * @param {string} [data.audience_filter_id] - UUID of the audience filter.
   * @param {string} [data.target_role] - Target role ('DEUDOR', 'CODEUDOR', 'AMBAS').
   * @param {string|null} [data.codebtor_strategy] - Co-debtor strategy if applicable.
   * @param {string|null} [data.scheduled_at] - Optional scheduled date in ISO format.
   * @param {string|null} [data.special_variable_value] - Optional value for special variable.
   */
  constructor({
    name,
    channel_type,
    message_template_id,
    audience_filter_id,
    target_role,
    codebtor_strategy = null,
    scheduled_at = null,
    special_variable_value = null,
  }) {
    if (name !== undefined) {
      if (name.length < 5 || name.length > 150) {
        throw new Error("Campaign name must be between 5 and 150 characters.");
      }
      this.name = name;
    }
    
    if (channel_type !== undefined) {
      if (!['SMS', 'WHATSAPP', 'EMAIL'].includes(channel_type)) {
        throw new Error("Invalid channel type.");
      }
      this.channel_type = channel_type;
    }
    
    if (message_template_id !== undefined) {
      this.message_template_id = message_template_id;
    }
    
    if (audience_filter_id !== undefined) {
      this.audience_filter_id = audience_filter_id;
    }
    
    if (target_role !== undefined) {
      if (!['DEUDOR', 'CODEUDOR', 'AMBAS'].includes(target_role)) {
        throw new Error("Invalid target role.");
      }
      this.target_role = target_role;
      
      // codebtor_strategy is required if target_role is CODEUDOR or AMBAS
      if (target_role === 'CODEUDOR' || target_role === 'AMBAS') {
        if (!codebtor_strategy) {
          throw new Error("Co-debtor strategy is required if target role is CODEUDOR or AMBAS.");
        }
        this.codebtor_strategy = codebtor_strategy;
      } else {
        this.codebtor_strategy = null;
      }
    }
    
    if (scheduled_at !== undefined) this.scheduled_at = scheduled_at;
    if (special_variable_value !== undefined) this.special_variable_value = special_variable_value;
  }
}

export default CampaignUpdate;
