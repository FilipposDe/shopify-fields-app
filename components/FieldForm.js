import React, { useState } from 'react'
import { fieldTypes } from '../helpers/constants'
import {
    Button,
    Card,
    Checkbox,
    ChoiceList,
    Form,
    FormLayout,
    Heading,
    Layout,
    Page,
    TextField,
} from '@shopify/polaris'

function FieldForm(props) {
    const [formData, setFormData] = useState(props.initialData)

    const isDataChanged = () =>
        formData.name !== props.initialData.name ||
        formData.description !== props.initialData.description ||
        formData.type !== props.initialData.type

    return (
        <Form onSubmit={() => props.onSubmit(formData)} noValidate={false}>
            <FormLayout>
                <TextField
                    value={formData.name}
                    onChange={(v) => setFormData({ ...formData, name: v })}
                    label="Field name"
                    type="text"
                    minLength={3}
                    maxLength={30}
                    disabled={props.isChangeable === false}
                />
                <TextField
                    value={formData.description}
                    onChange={(v) =>
                        setFormData({ ...formData, description: v })
                    }
                    label="Description (optional)"
                    type="text"
                    maxLength={300}
                />
                <ChoiceList
                    title="Type"
                    choices={[
                        { label: 'Text', value: fieldTypes.TEXT },
                        { label: 'Number', value: fieldTypes.NUMBER },
                    ]}
                    selected={formData.type}
                    onChange={(v) => setFormData({ ...formData, type: v[0] })}
                    disabled={props.isChangeable === false}
                />
                <Button
                    submit
                    primary
                    loading={props.loading}
                    disabled={!isDataChanged()}
                >
                    Save
                </Button>
            </FormLayout>
        </Form>
    )
}

export default FieldForm
