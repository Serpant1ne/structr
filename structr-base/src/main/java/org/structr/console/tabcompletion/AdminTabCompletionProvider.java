/*
 * Copyright (C) 2010-2022 Structr GmbH
 *
 * This file is part of Structr <http://structr.org>.
 *
 * Structr is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Structr is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Structr.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.structr.console.tabcompletion;

import org.structr.common.SecurityContext;
import org.structr.console.shell.AdminConsoleCommand;
import org.structr.core.app.StructrApp;

import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

/**
 *
 */
public class AdminTabCompletionProvider extends AbstractTabCompletionProvider {

	private final List<String> words = new LinkedList<>();

	public AdminTabCompletionProvider() {


	}

	@Override
	public List<TabCompletionResult> getTabCompletion(final SecurityContext securityContext, final String line) {

		final List<TabCompletionResult> results = new LinkedList<>();
		final String token                      = getToken(line, " ");

		results.addAll(getExactResultsForCollection(AdminConsoleCommand.commandNames(), token, " "));
		results.addAll(getCaseInsensitiveResultsForCollection(words, token, " "));

		Collections.sort(results);

		return results;
	}

	private Set<String> getNodeTypes() {
		return StructrApp.getConfiguration().getNodeEntities().keySet();
	}
}