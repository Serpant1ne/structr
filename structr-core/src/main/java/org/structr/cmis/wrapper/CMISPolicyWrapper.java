package org.structr.cmis.wrapper;

import org.apache.chemistry.opencmis.commons.enums.BaseTypeId;
import org.apache.chemistry.opencmis.commons.spi.BindingsObjectFactory;
import org.structr.cmis.info.CMISPolicyInfo;
import org.structr.common.error.FrameworkException;

/**
 *
 * @author Christian Morgner
 */
public class CMISPolicyWrapper extends CMISObjectWrapper<CMISPolicyInfo> {

	public CMISPolicyWrapper(final String propertyFilter, final Boolean includeAllowableActions) {
		super(BaseTypeId.CMIS_POLICY, propertyFilter, includeAllowableActions);
	}

	@Override
	public void createProperties(final BindingsObjectFactory factory, final FilteredPropertyList properties) {
	}

	@Override
	public void initializeFrom(final CMISPolicyInfo info) throws FrameworkException {
		super.initializeFrom(info);
	}
}